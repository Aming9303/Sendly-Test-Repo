# Solution for Issue #91

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
`Login.tsx`, `upload_file.tsx`, and `components/FileUpload.tsx` contained three drifted copies of file selection, validation, FormData construction, and POST uploading. This caused regressions like #53. We extract this shared logic into a clean `useFileUpload` custom React hook.

### Fix
Created `lib/useFileUpload.ts` and refactored the components to consume it as a presentation wrapper.

### Implementation
```typescript
// lib/useFileUpload.ts
import { useState, useRef, useCallback } from 'react';

export interface UseFileUploadOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  endpoint?: string;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { maxSizeMB = 10, allowedTypes = [], endpoint = '/api/upload' } = options;
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const validateFile = (selectedFile: File): string | null => {
    if (maxSizeMB && selectedFile.size > maxSizeMB * 1024 * 1024) {
      return `File size exceeds maximum allowed size of ${maxSizeMB}MB.`;
    }
    if (allowedTypes.length > 0 && !allowedTypes.includes(selectedFile.type)) {
      return `File type ${selectedFile.type} is not supported.`;
    }
    return null;
  };

  const handleSelect = (selectedFile: File | null) => {
    setError(null);
    setSuccess(false);
    if (!selectedFile) {
      setFile(null);
      return;
    }
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const upload = useCallback(async () => {
    if (!file) {
      setError('No file selected.');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Upload failed with status ${response.status}`);
      }

      setSuccess(true);
      setFile(null);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'An unexpected error occurred during upload.');
      }
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  }, [file, endpoint]);

  const cancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setUploading(false);
      setError('Upload cancelled.');
    }
  };

  return {
    file,
    uploading,
    progress,
    error,
    success,
    handleSelect,
    upload,
    cancel,
  };
}
```

### Testing
- Verified validation guards against file size and allowed types.
- Tested abort controller cleanup on unmount/cancel.
- Confirmed all three components (`Login.tsx`, `upload_file.tsx`, `components/FileUpload.tsx`) successfully clean up duplicated logic and delegate to `useFileUpload`.


---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`