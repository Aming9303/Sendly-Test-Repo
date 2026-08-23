import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  uploadUrl?: string;
  onFilesSelected?: (files: File[]) => void;
  onUploadSuccess?: () => void;
  onUploadError?: (message: string) => void;
}

interface SelectedFile {
  id: string;
  file: File;
  previewUrl: string;
}

const revokePreview = (selectedFile: SelectedFile) => {
  if (selectedFile.previewUrl) {
    URL.revokeObjectURL(selectedFile.previewUrl);
  }
};

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = 'image/*,.pdf,.doc,.docx',
  maxSizeMB = 5,
  multiple = false,
  uploadUrl,
  onFilesSelected,
  onUploadSuccess,
  onUploadError,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedFilesRef = useRef<SelectedFile[]>([]);
  const nextFileId = useRef(0);

  const replaceSelectedFiles = useCallback((nextFiles: SelectedFile[]) => {
    selectedFilesRef.current.forEach(revokePreview);
    selectedFilesRef.current = nextFiles;
    setSelectedFiles(nextFiles);
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of files) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          errors.push(`File "${file.name}" exceeds ${maxSizeMB}MB limit.`);
          continue;
        }
        validFiles.push(file);
      }

      setMessage(null);

      if (validFiles.length === 0) {
        setError(errors.length > 0 ? errors.join(' ') : 'No valid files selected.');
        replaceSelectedFiles([]);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
        return;
      }

      setError(errors.length > 0 ? errors.join(' ') : null);
      const nextFiles = validFiles.map((file): SelectedFile => ({
        id: `${file.name}:${file.size}:${file.lastModified}:${nextFileId.current++}`,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      }));
      replaceSelectedFiles(nextFiles);

      onFilesSelected?.(validFiles);
    },
    [maxSizeMB, onFilesSelected, replaceSelectedFiles],
  );

  const handleUpload = useCallback(async () => {
    if (!uploadUrl) {
      setError('Upload URL is not configured.');
      return;
    }

    if (selectedFiles.length === 0) {
      setError('Please select a file before uploading.');
      return;
    }

    setIsUploading(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      const fieldName = multiple ? 'files' : 'file';

      for (const selectedFile of selectedFiles) {
        formData.append(fieldName, selectedFile.file, selectedFile.file.name);
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      setMessage('Upload successful!');
      onUploadSuccess?.();
    } catch (err) {
      const uploadError = err instanceof Error ? err.message : 'Upload failed.';
      setError(uploadError);
      onUploadError?.(uploadError);
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, [multiple, onUploadError, onUploadSuccess, selectedFiles, uploadUrl]);

  const handleRemove = useCallback(() => {
    replaceSelectedFiles([]);
    setError(null);
    setMessage(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [replaceSelectedFiles]);

  const handleRemoveFile = useCallback(
    (id: string) => {
      if (!multiple) {
        return;
      }

      const fileToRemove = selectedFilesRef.current.find((item) => item.id === id);
      if (!fileToRemove) {
        return;
      }

      revokePreview(fileToRemove);
      const remainingFiles = selectedFilesRef.current.filter((item) => item.id !== id);
      selectedFilesRef.current = remainingFiles;
      setSelectedFiles(remainingFiles);
      onFilesSelected?.(remainingFiles.map((item) => item.file));

      if (remainingFiles.length === 0 && inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [multiple, onFilesSelected],
  );

  useEffect(() => {
    return () => {
      selectedFilesRef.current.forEach(revokePreview);
    };
  }, []);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
      />
      {error && (
        <p role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {selectedFiles.map((item) => (
        <div key={item.id}>
          {item.previewUrl && (
            <img
              src={item.previewUrl}
              alt="preview"
              style={{ width: 100, height: 100, objectFit: 'cover' }}
            />
          )}
          {multiple && (
            <button
              type="button"
              onClick={() => handleRemoveFile(item.id)}
              disabled={isUploading}
              aria-label={`Remove ${item.file.name}`}
            >
              Remove {item.file.name}
            </button>
          )}
        </div>
      ))}
      {selectedFiles.length > 0 && (
        <>
          <button type="button" onClick={handleRemove} disabled={isUploading}>
            {multiple ? 'Remove all' : 'Remove'}
          </button>
          {uploadUrl && (
            <button type="button" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          )}
        </>
      )}
    </div>
  );
};
