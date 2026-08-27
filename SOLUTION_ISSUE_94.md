# Solution for Issue #94

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The file picker and upload button are currently sitting loose inside a `<div>` without a wrapping `<form>` element. Furthermore, the button has `type="button"` (or none), which prevents keyboard users from triggering the upload action by pressing `Enter` after selecting a file.

### Fix
Wrap the file input and button in a `<form>` element, attach an `onSubmit` handler that invokes `preventDefault()` and `handleUpload()`, and change the upload button to `type="submit"`.

### Implementation
```tsx
export function FileUploadComponent() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = () => {
    if (!file || uploading) return;
    setUploading(true);
    // ... existing upload logic & double-submit guard
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleUpload();
      }}
      className="flex flex-col gap-4"
    >
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        aria-label="Choose file"
      />
      <button
        type="submit"
        disabled={!file || uploading}
        className="btn-primary"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}
```

### Testing
1. Select a file using the keyboard/file picker.
2. Press `Enter`. Verify that `handleUpload` is called and upload begins.
3. Verify `event.preventDefault()` stops page reload.
4. Verify double-submit guard prevents multiple concurrent uploads.


---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`