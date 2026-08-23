# Solution for Issue #87

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
Both `Login.tsx` and `components/FileUpload.tsx` currently expose raw transport errors (e.g. `Upload failed with status 500` or `TypeError: Failed to fetch`) directly in the UI. Users should see clear, friendly, and actionable error messages while technical diagnostics remain logged to the console.

### Fix
Create a robust error-mapping utility and update both components to handle network errors (`TypeError` / offline checks) and HTTP error classes (4xx client errors vs 5xx server errors) gracefully.

### Implementation
```typescript
// utils/errorHandler.ts
export function getFriendlyErrorMessage(err: unknown, defaultMsg = 'An unexpected error occurred. Please try again.'): string {
  if (!navigator.onLine) {
    return 'You appear to be offline. Please check your internet connection and try again.';
  }

  if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
    return 'Unable to connect to the server. Please check your connection or try again later.';
  }

  if (err instanceof Error) {
    // If it's a custom HTTP status error or message string
    const msg = err.message;
    if (msg.includes('status 5') || msg.includes('500') || msg.includes('502') || msg.includes('503')) {
      return 'The server is currently experiencing issues. Please try again shortly.';
    }
    if (msg.includes('status 4') || msg.includes('400') || msg.includes('401') || msg.includes('403') || msg.includes('404')) {
      return 'There was an issue with your request. Please check your input and try again.';
    }
    return msg;
  }

  return defaultMsg;
}
```

### Testing
1. Simulate offline state (`navigator.onLine = false`) and verify the offline message appears.
2. Trigger 5xx errors and verify friendly server error messaging.
3. Check browser console to confirm full technical errors are still logged via `console.error`.


---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`