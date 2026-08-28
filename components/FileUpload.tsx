import React, { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_MAX_SIZE_MB = 10;
const inputId = 'file-upload-input';
const errorId = 'file-upload-error';
const statusId = 'file-upload-status';

const isFileTypeAccepted = (file: File, accept: string) => {
  const acceptedTypes = accept
    .split(',')
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean);

  return acceptedTypes.some((acceptedType) => {
    if (acceptedType.endsWith('/*')) {
      return file.type.toLowerCase().startsWith(acceptedType.slice(0, -1));
    }

    if (acceptedType.startsWith('.')) {
      return file.name.toLowerCase().endsWith(acceptedType);
    }

    return file.type.toLowerCase() === acceptedType;
  });
};

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
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
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
  const uploadInFlightRef = useRef(false);

  const clearSelection = useCallback(() => {
    setSelectedFiles((files) => {
      files.forEach(revokePreview);
      return [];
    });

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const maxBytes = maxSizeMB * 1024 * 1024;
      const validFiles: File[] = [];
      const oversizedFileNames: string[] = [];
      const invalidFileNames: string[] = [];

      for (const file of files) {
        if (file.size > maxBytes) {
          oversizedFileNames.push(file.name);
          continue;
        }

        if (!isFileTypeAccepted(file, accept)) {
          invalidFileNames.push(file.name);
          continue;
        }

        validFiles.push(file);
      }

      setMessage(null);
      clearSelection();

      if (validFiles.length === 0) {
        setError(
          oversizedFileNames.length > 0
            ? `File${oversizedFileNames.length === 1 ? '' : 's'} "${oversizedFileNames.join(', ')}" exceed${
                oversizedFileNames.length === 1 ? 's' : ''
              } ${maxSizeMB}MB limit.`
            : invalidFileNames.length > 0
              ? `File${invalidFileNames.length === 1 ? '' : 's'} "${invalidFileNames.join(', ')}" are not allowed.`
              : 'No valid files selected.',
        );
        return;
      }

      const newSelectedFiles = validFiles.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        file,
        previewUrl: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : '',
      }));

      setError(
        oversizedFileNames.length > 0
          ? `Skipped oversized file${oversizedFileNames.length === 1 ? '' : 's'}: ${oversizedFileNames.join(', ')}.`
          : invalidFileNames.length > 0
            ? `Skipped invalid file${invalidFileNames.length === 1 ? '' : 's'}: ${invalidFileNames.join(', ')}.`
            : null,
      );
      setSelectedFiles(newSelectedFiles);
      onFilesSelected?.(validFiles);
    },
    [accept, clearSelection, maxSizeMB, onFilesSelected],
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

    if (uploadInFlightRef.current) {
      return;
    }

    uploadInFlightRef.current = true;
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
      uploadInFlightRef.current = false;
      setIsUploading(false);
    }
  }, [multiple, onUploadError, onUploadSuccess, selectedFiles, uploadUrl]);

  const handleRemoveFile = useCallback((id: string) => {
    setSelectedFiles((files) => {
      const fileToRemove = files.find((file) => file.id === id);
      if (fileToRemove) {
        revokePreview(fileToRemove);
      }
      return files.filter((file) => file.id !== id);
    });
  }, []);

  const handleRemove = useCallback(() => {
    clearSelection();
    setError(null);
    setMessage(null);
  }, [clearSelection]);

  useEffect(() => {
    return () => {
      selectedFiles.forEach(revokePreview);
    };
  }, []);

  const describedBy = [error ? errorId : null, message ? statusId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div>
      <label htmlFor={inputId}>Select {multiple ? 'files' : 'a file'}</label>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        aria-describedby={describedBy || undefined}
        aria-invalid={Boolean(error)}
        onChange={handleFileChange}
      />
      {error && (
        <p id={errorId} role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}
      {message && (
        <p id={statusId} role="status">
          {message}
        </p>
      )}
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
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              aria-busy={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          )}
        </>
      )}
    </div>
  );
};
