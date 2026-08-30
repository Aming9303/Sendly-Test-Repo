# Solution for Issue #92

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The `maxSizeMB` prop in `components/FileUpload.tsx` is trusted blindly without validation. Passing `NaN` makes all size comparisons evaluate to false (all files pass), while `0` or negative values reject all files with invalid limit messages.

### Fix
Add a validation helper or sanitization guard inside `FileUpload.tsx` to ensure `maxSizeMB` is a positive finite number, falling back to a safe default (`5`) with a development warning (`console.warn`) when invalid.

### Implementation
```typescript
// Inside components/FileUpload.tsx

const DEFAULT_MAX_SIZE_MB = 5;

function getValidatedMaxSize(maxSizeMB: number | undefined): number {
  if (
    typeof maxSizeMB !== 'number' ||
    Number.isNaN(maxSizeMB) ||
    maxSizeMB <= 0 ||
    !Number.isFinite(maxSizeMB)
  ) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[FileUpload] Invalid maxSizeMB prop received: ${maxSizeMB}. Falling back to default (${DEFAULT_MAX_SIZE_MB}MB).`
      );
    }
    return DEFAULT_MAX_SIZE_MB;
  }
  return maxSizeMB;
}
```

### Testing
1. Test with `maxSizeMB={NaN}` -> Falls back to 5 and logs dev warning.
2. Test with `maxSizeMB={0}` or `maxSizeMB={-5}` -> Falls back to 5 and logs dev warning.
3. Test with valid `maxSizeMB={10}` -> Uses 10 correctly without warnings.
4. Production build (`NODE_ENV=production`) -> Falls back silently without logging.


---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`