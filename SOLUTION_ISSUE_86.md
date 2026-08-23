# Solution for Issue #86

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The component `components/FileUpload.tsx` lacked per-file removal mechanisms and relied on array indices (`key={idx}`) for preview rendering. When removing a file by index, index shifts caused stale object URLs and wrong previews to attach to files.

### Fix
Update `FileUpload.tsx` to include an individual remove button per file, stable file keys, and proper URL revocation.

### Implementation
```tsx
import React, { useState, useEffect } from 'react';

interface FileUploadProps {
  multiple?: boolean;
  onFilesChange?: (files: File[]) => void;
}

interface FileItem {
  id: string;
  file: File;
  previewUrl: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ multiple = true, onFilesChange }) => {
  const [fileItems, setFileItems] = useState<FileItem[]>([]);

  useEffect(() => {
    return () => {
      fileItems.forEach(item => URL.revokeObjectURL(item.previewUrl));
    };
  }, [fileItems]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    
    const newItems: FileItem[] = newFiles.map(file => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    const updated = multiple ? [...fileItems, ...newItems] : newItems;
    if (!multiple && fileItems.length > 0) {
      fileItems.forEach(item => URL.revokeObjectURL(item.previewUrl));
    }

    setFileItems(updated);
    onFilesChange?.(updated.map(i => i.file));
  };

  const handleRemoveFile = (id: string) => {
    const target = fileItems.find(item => item.id === id);
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
    }
    const updated = fileItems.filter(item => item.id !== id);
    setFileItems(updated);
    onFilesChange?.(updated.map(i => i.file));
  };

  const handleRemoveAll = () => {
    fileItems.forEach(item => URL.revokeObjectURL(item.previewUrl));
    setFileItems([]);
    onFilesChange?.([]);
  };

  return (
    <div className="file-upload-container">
      <input type="file" multiple={multiple} onChange={handleFileSelect} />
      {fileItems.length > 0 && (
        <button type="button" onClick={handleRemoveAll}>Remove All</button>
      )}
      <div className="preview-list">
        {fileItems.map(item => (
          <div key={item.id} className="preview-item">
            <img src={item.previewUrl} alt={item.file.name} width={100} />
            <span>{item.file.name}</span>
            {multiple && (
              <button type="button" onClick={() => handleRemoveFile(item.id)}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Testing
Verify that uploading multiple files renders individual remove buttons, removing one file revokes its preview URL and updates the list without shifting or breaking other previews, and single-file mode behaves correctly.


---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`