# Solution for Issue #94

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The file picker and upload button are currently sitting loose inside a `<div>` without a wrapping `<form>`. Consequently, keyboard users who select a file and press `Enter` cannot trigger submission. Furthermore, the button is defined as `type="button"`.

### Fix
Wrap the inputs inside a `<form>` element with an `onSubmit` handler, call `e.preventDefault()`, and ensure the upload button has `type="submit"`.

### Implementation
```tsx
<form onSubmit={(e) => { e.preventDefault(); handleUpload(); }}>
  <input 
    type="file" 
    onChange={handleFileChange} 
    disabled={uploading} 
  />
  <button 
    type="submit" 
    disabled={!selectedFile || uploading}
  >
    Upload
  </button>
</form>
```

### Testing
Verify that pressing `Enter` while focused on the file input or button triggers `handleUpload()` without a full page reload, and that double-submit guards remain fully intact.

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`