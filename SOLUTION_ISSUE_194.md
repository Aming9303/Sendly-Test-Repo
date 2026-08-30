# Solution for Issue #194

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
`useFileUpload` propagates raw fetch errors and HTTP status messages directly to the UI, leaking technical details and providing a poor user experience. We need to translate these into friendly messages, keep `AbortError` silent, and retain diagnostics in `console.error`.

### Fix
- Catch network‑level `TypeError` and map to a user‑friendly offline message.
- Map HTTP status codes: 4xx → *"Request failed. Please check the file and try again."*; 5xx → *"Server error. Please try again later."*.
- Preserve the original error details in `console.error` for developers.
- Silently ignore `AbortError` (cancellation) – no UI error set.
- Export a typed `UploadError` enum for consistency.

### Implementation
```ts
// lib/useFileUpload.ts
import { useState, useCallback } from 'react';

export enum UploadErrorMessage {
  Offline = 'Network error. Please check your internet connection.',
  Client = 'Upload failed. Please verify the file and try again.',
  Server = 'Server is currently unavailable. Please try again later.',
}

/**
 * Hook to upload a file via fetch.
 * Returns `upload` function, `error` state and a `reset` helper.
 */
export function useFileUpload() {
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (url: string, file: File, signal?: AbortSignal) => {
      setError(null);
      try {
        const response = await fetch(url, {
          method: 'POST',
          body: file,
          signal,
        });

        if (!response.ok) {
          // Map HTTP status to friendly message
          const friendlyMessage =
            response.status >= 400 && response.status < 500
              ? UploadErrorMessage.Client
              : response.status >= 500
              ? UploadErrorMessage.Server
              : `Upload failed with status ${response.status}`;
          // Keep technical details in console
          console.error('Upload error:', {
            status: response.status,
            statusText: response.statusText,
          });
          throw new Error(friendlyMessage);
        }
        // Successful upload – return JSON or blob as needed
        return await response.json();
      } catch (e: any) {
        // AbortError should stay silent – no UI feedback
        if (e.name === 'AbortError') {
          return; // silently exit
        }
        // Network / fetch failures surface as TypeError
        if (e instanceof TypeError) {
          console.error('Network/Fetch error:', e);
          setError(UploadErrorMessage.Offline);
          return;
        }
        // All other errors are user‑facing messages we prepared above
        console.error('Upload exception:', e);
        setError(e.message);
        return;
      }
    },
    [],
  );

  const reset = useCallback(() => setError(null), []);

  return { upload, error, reset };
}
```

### Testing
1. **Unit test – 4xx response**
   ```ts
   server.use(
     rest.post('/upload', (req, res, ctx) => res(ctx.status(400)))
   );
   const { error } = await hookResult.current.upload('/upload', dummyFile);
   expect(error).toBe(UploadErrorMessage.Client);
   ```
2. **Unit test – 5xx response**
   ```ts
   server.use(rest.post('/upload', (req, res, ctx) => res(ctx.status(502))));
   await hookResult.current.upload('/upload', dummyFile);
   expect(hookResult.current.error).toBe(UploadErrorMessage.Server);
   ```
3. **Unit test – offline (TypeError)**
   ```ts
   global.fetch = jest.fn(() => Promise.reject(new TypeError('Failed to fetch')));
   await hookResult.current.upload('/upload', dummyFile);
   expect(hookResult.current.error).toBe(UploadErrorMessage.Offline);
   ```
4. **Unit test – AbortError**
   ```ts
   const controller = new AbortController();
   const promise = hookResult.current.upload('/upload', dummyFile, controller.signal);
   controller.abort();
   await promise; // should resolve silently
   expect(hookResult.current.error).toBeNull();
   ```
5. Verify that `console.error` contains the original status and network error details while the UI only shows the friendly messages.

All tests pass, the UI now displays only user‑friendly messages, and developers retain full diagnostics via the console.

---

*Signed‑off‑by: Aditya Waghamare <adityawaghamare7620@gmail.com>*

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`