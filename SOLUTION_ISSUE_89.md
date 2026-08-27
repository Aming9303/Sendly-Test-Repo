# Solution for Issue #89

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
Unmounting components (`Login.tsx`, `upload_file.tsx`, `components/FileUpload.tsx`) during active `fetch` uploads causes background network requests to continue wastefully and triggers `setState` updates on unmounted components (`setMessage`/`setIsUploading`), leading to React warnings and potential memory leaks.

### Fix
Implement `AbortController` in `handleUpload` across these files, with `useEffect` cleanup handling on component unmount and distinct handling of `AbortError` so aborted uploads do not trigger error states.

### Implementation
```tsx
import { useState, useEffect, useRef } from 'react';

// Example pattern applied to handleUpload across Login.tsx, upload_file.tsx, and components/FileUpload.tsx
export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleUpload = async (file: File, url: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      setMessage('Upload successful!');
      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Request was aborted due to unmount or new upload — ignore
        return;
      }
      setMessage(err.message || 'Upload failed');
    } finally {
      if (controller === abortControllerRef.current) {
        setIsUploading(false);
      }
    }
  };

  return { isUploading, message, handleUpload };
}
```

### Testing
1. Initiate file upload in `Login.tsx`, `upload_file.tsx`, or `components/FileUpload.tsx`.
2. Navigate away or unmount component mid-upload.
3. Verify network request cancels immediately and no state update warnings appear in console.


---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`