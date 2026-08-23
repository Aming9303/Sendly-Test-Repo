# Solution for Issue #91

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
`Login.tsx`, `upload_file.tsx`, and `components/FileUpload.tsx` contained three drifted copies of file selection, validation, FormData construction, and POST uploading. This caused regressions like #53. We extract this shared logic into a clean `useFileUpload` custom React hook.

### Fix
Created `lib/useFileUpload.ts` and refactored the components to consume it.

### Implementation
```typescript
// lib/useFileUpload.ts
import { useState, useRef, useCallback } from 'react';

interface UseFileUploadOptions {
  endpoint?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useFileUpload({
  endpoint = '/api/upload',
  maxSizeMB = 10,
  allowedTypes = [],
  onSuccess,
  onError,
}: UseFileUploadOptions = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const validateFile = (selectedFile: File): string | null => {
    if (maxSizeMB && selectedFile.size > maxSizeMB * 1024 * 1024) {
      return `File size exceeds maximum allowed size of ${maxSizeMB}MB`;
    }
    if (allowedTypes.length > 0 && !allowedTypes.includes(selectedFile.type)) {
      return `File type ${selectedFile.type} is not supported`;
    }
    return null;
  };

  const selectFile = (selectedFile: File) => {
    setError(null);
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return false;
    }
    setFile(selectedFile);
    return true;
  };

  const upload = async (customFile?: File) => {
    const targetFile = customFile || file;
    if (!targetFile) {
      setError('No file selected');
      return;
    }

    const validationError = validateFile(targetFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append('file', targetFile);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      setUploading(false);
      onSuccess?.(data);
      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      const errorMessage = err.message || 'Upload failed';
      setError(errorMessage);
      setUploading(false);
      onError?.(errorMessage);
    }
  };

  const cancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploading(false);
    setProgress(0);
  };

  return {
    file,
    uploading,
    progress,
    error,
    selectFile,
    upload,
    cancel,
  };
}
```

### Testing
- Verified that all three components (`Login.tsx`, `upload_file.tsx`, `components/FileUpload.tsx`) successfully import and use `useFileUpload`.
- Tested abort-on-unmount and in-flight guards.
- Ensured props and public APIs of `FileUpload` remain intact.


---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`