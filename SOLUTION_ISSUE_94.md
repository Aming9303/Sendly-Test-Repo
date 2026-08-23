# Solution for Issue #94

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The file picker and upload button are currently sitting loose inside a `<div>` without a wrapping `<form>`. Consequently, keyboard users pressing `Enter` after selecting a file do not trigger any submission path, and the upload button is explicitly set to `type="button"`.

### Fix
Wrap the file input and upload controls in a semantic `<form>` element with an `onSubmit` handler, update the upload button to `type="submit"`, and ensure `e.preventDefault()` is called to prevent full-page reloads while respecting existing in-flight / double-submit guards.

### Implementation
```tsx
export default function FileUploadComponent() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = () => {
    if (!file || uploading) return;
    setUploading(true);
    // ... existing upload logic ...
    setTimeout(() => setUploading(false), 1500);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleUpload();
      }}
      className="flex flex-col gap-4 items-center"
    >
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        aria-label="Choose file to upload"
      />
      <button
        type="submit"
        disabled={!file || uploading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
}
```

### Testing
1. Select a file using the file picker via keyboard or mouse.
2. Press `Enter` and verify that `handleUpload()` is correctly triggered without reloading the page.
3. Verify that double-submit guards prevent concurrent uploads when in-flight.


---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`