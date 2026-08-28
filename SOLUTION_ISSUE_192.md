# Solution for Issue #192

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The `FileUpload` component contained duplicate JSX attributes (`id={inputId}` and `id="file-upload-input"`, as well as duplicate `aria-describedby` props) on the underlying `<input type="file">` element. In HTML/React, duplicate DOM attributes are invalid, causing React to override one attribute with the other unpredictably, which breaks screen reader accessibility and invalidates the `<label htmlFor={inputId}>` association.

### Fix
1. Consolidated `id` to a single attribute reference (`inputId`), ensuring `<label htmlFor={inputId}>` always matches `<input id={inputId}>`.
2. Consolidated ARIA descriptions into a single `aria-describedby` attribute by combining custom `describedBy` props with active status and error element IDs (`file-upload-error`, `file-upload-status`).
3. Ensured error and status element `id` attributes directly match the consolidated `aria-describedby` target IDs.

---

### Implementation

`components/FileUpload.tsx`:

```typescript
import React, { useId } from 'react';

export interface FileUploadProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  statusText?: string;
  describedBy?: string;
  onFileSelect?: (file: File | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  id,
  label = 'Upload File',
  error,
  statusText,
  describedBy,
  onFileSelect,
  onChange,
  disabled,
  className,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || `file-upload-input-${generatedId}`;
  const errorId = 'file-upload-error';
  const statusId = 'file-upload-status';

  // Construct single aria-describedby attribute value without duplicate HTML attributes
  const ariaDescribedBy = [
    describedBy,
    error ? errorId : null,
    statusText ? statusId : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onFileSelect) {
      const file = e.target.files ? e.target.files[0] : null;
      onFileSelect(file);
    }
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className={`file-upload-wrapper ${className || ''}`}>
      {label && (
        <label htmlFor={inputId} className="file-upload-label">
          {label}
        </label>
      )}

      <input
        {...props}
        id={inputId}
        type="file"
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        aria-invalid={Boolean(error)}
        onChange={handleChange}
        className="file-upload-input"
      />

      {error && (
        <div id={errorId} className="file-upload-error" role="alert">
          {error}
        </div>
      )}

      {statusText && (
        <div id={statusId} className="file-upload-status" role="status">
          {statusText}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
```

---

### Key Changes Summary (Diff View)

```diff
- <input
-   id={inputId}
-   id="file-upload-input"
-   aria-describedby={describedBy}
-   aria-describedby="file-upload-error file-upload-status"
- />
+ <input
+   id={inputId}
+   aria-describedby={ariaDescribedBy}
+ />
```

---

### Testing
1. **DOM Inspection / HTML Validity**: Verified with W3C HTML validator and DevTools to ensure no duplicate attributes are rendered on `<input type="file">`.
2. **Accessibility (a11y)**:
   - Clicking `<label htmlFor={inputId}>` correctly triggers file browser focus on `<input id={inputId}>`.
   - Screen reader reads errors/statuses linked via `aria-describedby="file-upload-error file-upload-status"`.
3. **Unit Tests**: Executed `@testing-library/react` tests to verify `aria-describedby` dynamically resolves based on error and status state props.

Signed-off-by: Aditya Waghamare <adityawaghamare7620@gmail.com>

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`