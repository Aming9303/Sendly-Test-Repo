# Solution for Issue #92

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The `maxSizeMB` prop in `components/FileUpload.tsx` is trusted blindly without validation. Passing `NaN` makes all size comparisons evaluate to false (all files pass), while `0` or negative values reject all files with invalid limit messages.

### Fix
Add robust validation and coercion of `maxSizeMB` at the top of the component or within the size validation logic, defaulting to `5` with a development `console.warn` when `maxSizeMB` is invalid (`NaN`, `<= 0`, non-finite, or non-number).

### Implementation
```tsx
// In components/FileUpload.tsx

const DEFAULT_MAX_SIZE_MB = 5;

// Inside the FileUpload component:
const getValidatedMaxSizeMB = (propValue: number | undefined): number => {
  if (
    propValue === undefined ||
    typeof propValue !== 'number' ||
    Number.isNaN(propValue) ||
    propValue <= 0
  ) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[FileUpload] Invalid maxSizeMB prop provided: "${propValue}". Falling back to default (${DEFAULT_MAX_SIZE_MB}MB).`
      );
    }
    return DEFAULT_MAX_SIZE_MB;
  }
  return propValue;
};

const effectiveMaxSizeMB = getValidatedMaxSizeMB(maxSizeMB);
```

### Testing
- Verify passing `maxSizeMB={NaN}` triggers the development warning and uses `5MB`.
- Verify passing `maxSizeMB={0}` or `maxSizeMB={-3}` triggers the warning and uses `5MB`.
- Verify valid `maxSizeMB` (e.g. `10`) works as expected without warnings.
- Verify production builds omit the warning while maintaining safe fallback behavior.


---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`