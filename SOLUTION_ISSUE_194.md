# Solution for Issue #194

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
`useFileUpload` propagates raw fetch errors and HTTP status codes to the UI, exposing technical details and confusing messages to end‑users.

### Fix
* Centralise error handling inside the hook.
* Map HTTP 4xx/5xx responses to friendly, user‑oriented messages.
* Detect network/offline failures (`TypeError` from `fetch`) and show a generic “Network error – please check your connection.” message.
* Keep `AbortError` silent – it occurs when the request is cancelled.
* Log the original error/response to the console for debugging while only exposing the friendly message via `setError`.

### Implementation
```tsx
// lib/useFileUpload.ts
import { useState, useCallback } from 'react';

/**
 * Hook to upload a file via the provided endpoint.
 * Returns the upload state and a function to trigger the upload.
 */
export function useFileUpload(uploadUrl: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  // Helper to translate HTTP status codes to user‑friendly messages
  const getFriendlyMessage = (status: number): string => {
    if (status >= 400 && status < 500) {
      return 'Upload failed – the server rejected the file. Please check the file format and try again.';
    }
    if (status >= 500) {
      return 'Upload failed – the server encountered an error. Please try again later.';
    }
    return 'Upload failed – unexpected error.';
  };

  const upload = useCallback(
    async (file: File, abortSignal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      setProgress(0);

      const form = new FormData();
      form.append('file', file);

      try {
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: form,
          signal: abortSignal,
        });

        // -------------------------------------------------------------------
        // 1️⃣ HTTP error handling – map to friendly UI text
        // -------------------------------------------------------------------
        if (!response.ok) {
          const friendly = getFriendlyMessage(response.status);
          // Keep technical details out of UI but log for developers
          console.error('File upload error', {
            status: response.status,
            statusText: response.statusText,
            url: uploadUrl,
          });
          setError(friendly);
          return null;
        }

        // -------------------------------------------------------------------
        // 2️⃣ Successful upload – parse response (adjust to your API shape)
        // -------------------------------------------------------------------
        const result = await response.json();
        return result;
      } catch (e: any) {
        // -------------------------------------------------------------------
        // 3️⃣ Network / Abort handling
        // -------------------------------------------------------------------
        if (e.name === 'AbortError') {
          // Silently ignore – caller cancelled the request
          return null;
        }
        if (e instanceof TypeError) {
          // This is typically a network/offline failure
          console.error('Network error during file upload', e);
          setError('Network error – please check your internet connection and try again.');
          return null;
        }
        // Fallback for any other unexpected errors
        console.error('Unexpected error during file upload', e);
        setError('Upload failed – please try again later.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [uploadUrl]
  );

  return { loading, error, progress, upload } as const;
}
```

### Testing
1. **4xx scenario** – Mock the fetch to return `status: 400`. Verify `error` state contains the friendly 4xx message and `console.error` logs the raw status.
2. **5xx scenario** – Mock `status: 502`. Expect the 5xx friendly message.
3. **Network offline** – Mock fetch to reject with `new TypeError('Failed to fetch')`. UI should show the network‑error string.
4. **Abort** – Create an `AbortController`, call `upload(file, controller.signal)` and immediately `controller.abort()`. No error message should appear; the hook stays silent.
5. **Success** – Mock a 200 response with JSON payload. Ensure `error` stays `null` and the returned payload matches.

All tests can be written with Jest + @testing‑library/react‑hooks, using `global.fetch = jest.fn()` to control responses.

---
*Signed‑off‑by: Aditya Waghamare <adityawaghamare7620@gmail.com>*

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`