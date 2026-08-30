# Solution for Issue #94

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The file picker and upload button are currently sitting loose inside a `<div>` with `onClick` handlers rather than being wrapped inside a semantic `<form>`. As a result, keyboard users who select a file and hit `Enter` do not trigger any form submission. Additionally, the button is defined as `type="button"` with no submit association.

### Fix
Wrap the file input and upload action button inside a `<form>` element, set the button `type="submit"`, and wire up the `onSubmit` handler to prevent the default page reload and call the upload handler safely with the existing double-submit guard.

### Implementation
```tsx
<form 
  onSubmit={(e) => { 
    e.preventDefault(); 
    if (!selectedFile || isUploading) return;
    handleUpload(); 
  }}
>
  <div className="upload-container">
    <input 
      type="file" 
      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
    />
    <button 
      type="submit" 
      disabled={!selectedFile || isUploading}
    >
      Upload
    </button>
  </div>
</form>
```

### Testing
1. Select a file using the keyboard/file picker.
2. Press `Enter` on the keyboard. Verify that `handleUpload()` is triggered and the file uploads without page reload.
3. Verify that pressing `Enter` when no file is selected or during an active upload does not trigger unintended submissions (guarded).


---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`