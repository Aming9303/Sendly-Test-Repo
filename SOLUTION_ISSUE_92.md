# Solution for Issue #92

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The `maxSizeMB` prop in `components/FileUpload.tsx` is trusted blindly. When passed as `NaN`, `0`, or negative values, it breaks file validation logic either by allowing any file size (`NaN`) or rejecting all files (`0` or negative). We need a robust sanitization helper that validates the prop, falls back to a sensible default (`5`), and logs a developer warning in non-production environments.

### Fix
Add a validation helper or guard at the top of the component or right where `maxSizeMB` is destructured/used, ensuring any `NaN`, `<= 0`, non-number, or invalid values fall back to `5` while issuing a `console.warn` when `process.env.NODE_ENV !== 'production'`.

### Implementation
```tsx
// Inside components/FileUpload.tsx

interface FileUploadProps {
  maxSizeMB?: number;
  // ... other props
}

function getValidMaxSize(maxSizeMB: number | undefined): number {
  const DEFAULT_MAX_SIZE = 5;
  
  if (
    typeof maxSizeMB !== 'number' || 
    Number.isNaN(maxSizeMB) || 
    maxSizeMB <= 0
  ) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[FileUpload] Invalid maxSizeMB prop provided: "${maxSizeMB}". Falling back to default value of ${DEFAULT_MAX_SIZE}MB.`
      );
    }
    return DEFAULT_MAX_SIZE;
  }
  
  return maxSizeMB;
}
```

### Testing
Verify that:
1. Passing `maxSizeMB={NaN}` results in validation using `5` and logs a warning in dev mode.
2. Passing `maxSizeMB={0}` or `maxSizeMB={-3}` falls back to `5` and logs a warning.
3. Passing a valid positive number (e.g., `10`) uses `10` without any warnings.
4. Production builds (`NODE_ENV === 'production'`) sanitize silently without console logs.

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`