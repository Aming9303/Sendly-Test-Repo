# Solution for Issue #93

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
The bug occurs because file uploads via drag-and-drop (`onDrop` using `event.dataTransfer.files`) bypass the validation logic (`validateFiles`) that is applied to the traditional file picker (`onChange`). To fix this, a shared validation utility function is used for both `onChange` and `onDrop`, ensuring size, type, and count checks are strictly enforced regardless of how the files are uploaded.

### Fix
```tsx
import React, { useState, useRef } from 'react';

interface FileValidatorProps {
  maxSizeMB?: number;
  allowedTypes?: string[];
  maxFiles?: number;
  onFilesSelected: (files: File[]) => void;
  onError: (error: string) => void;
}

export function FileDropzone({
  maxSizeMB = 10,
  allowedTypes = [],
  maxFiles = 5,
  onFilesSelected,
  onError,
}: FileValidatorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFiles = (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);

    if (filesArray.length === 0) return;

    if (filesArray.length > maxFiles) {
      onError(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    const validFiles: File[] = [];

    for (const file of filesArray) {
      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        onError(`File "${file.name}" exceeds maximum size of ${maxSizeMB}MB.`);
        return;
      }

      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        onError(`File type "${file.type}" is not supported.`);
        return;
      }

      validFiles.push(file);
    }

    onFilesSelected(validFiles);
    onError(''); // Clear error on success
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFiles(e.target.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`file-picker ${isDragging ? 'file-picker--dragging' : ''}`}
      style={{
        border: '2px dashed #ccc',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: isDragging ? '#f0f8ff' : '#fafafa',
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        multiple={maxFiles > 1}
        style={{ display: 'none' }}
      />
      <p>Drag and drop files here, or click to select files</p>
    </div>
  );
}
```

### Testing
Verify by dragging and dropping oversized files, unsupported file types, and valid files to confirm proper error handling and state updates match the picker validation path.

---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`