# Solution for Issue #93

## 🛠️ Proposed Solution (by Aditya Waghamare)

### Analysis
Only the file picker path (`onChange`) goes through validation checks, while drag-and-drop (`onDrop`) either doesn't exist or would bypass size/type/count checks if hooked up directly to state. To resolve this, both input paths must converge on a single shared validation function (`validateFiles` or equivalent) that validates files before setting state.

### Fix
Implement shared validation routine handling both picker `onChange` and dropzone `onDrop` with `event.dataTransfer.files`, accompanied by proper dragover visual states.

### Implementation
```typescript
import React, { useState, useCallback, useRef } from 'react';

interface FileValidatorProps {
  maxSizeMB?: number;
  acceptedTypes?: string[];
  maxFiles?: number;
  onFilesSelected: (files: File[]) => void;
  onError: (error: string) => void;
}

export const FileUploader: React.FC<FileValidatorProps> = ({
  maxSizeMB = 5,
  acceptedTypes = [],
  maxFiles = 10,
  onFilesSelected,
  onError
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcess = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    
    if (files.length === 0) return;

    if (files.length > maxFiles) {
      onError(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
        onError(`File "${file.name}" exceeds maximum size of ${maxSizeMB}MB.`);
        return;
      }

      if (acceptedTypes.length > 0 && !acceptedTypes.some(type => file.type.match(new RegExp(type.replace('*', '.*'))))) {
        onError(`File type "${file.type}" is not supported.`);
        return;
      }

      validFiles.push(file);
    }

    onFilesSelected(validFiles);
  }, [maxSizeMB, acceptedTypes, maxFiles, onFilesSelected, onError]);

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

    if (e.dataTransfer && e.dataTransfer.files) {
      validateAndProcess(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndProcess(e.target.files);
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
        backgroundColor: isDragging ? '#f0f8ff' : 'transparent'
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <p>Drag and drop files here, or click to select files</p>
    </div>
  );
};
```

### Testing
Verify by dropping files exceeding size limits or incorrect types onto the dropzone and confirming correct error callbacks are triggered identical to file input picker selection.


---
*Submitted by Aditya Waghamare*
💰 **Payout Address (Base L2 / EVM):** `0xb61dBcdBc3407F71EaCb64D4CBFAcf9FFfe2415C`