import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useFileUpload } from '../lib/useFileUpload';

const DEFAULT_MAX_SIZE_MB = 5;

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

const isFileTypeAccepted = (file: File, accept: string): boolean => {
  const acceptedTypes = accept.split(',').map(t => t.trim());
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  return acceptedTypes.some(acceptedType => {
    if (acceptedType.startsWith('.')) {
      return fileName.endsWith(acceptedType.toLowerCase());
    }
    if (acceptedType.endsWith('/*')) {
      const prefix = acceptedType.slice(0, -2);
      return fileType.startsWith(prefix);
    }
    return fileType === acceptedType;
  });
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
  const selectedFilesRef = useRef<SelectedFile[]>([]);

  const inputId = 'file-upload-input';
  const errorId = 'file-upload-error';
  const statusId = 'file-upload-status';

  // Keep ref in sync for cleanup
  useEffect(() => {
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const maxBytes = maxSizeMB * 1024 * 1024;
      const validFiles: File[] = [];
      const invalidFileNames: string[] = [];
      const errors: string[] = [];

      for (const file of files) {
        if (file.size > maxBytes) {
          invalidFileNames.push(file.name);
          continue;
        }

        if (!isFileTypeAccepted(file, accept)) {
          errors.push(
            `File "${file.name}" is not an allowed type. Allowed types: ${accept}.`,
          );
          continue;
        }

        validFiles.push(file);
      }

      setMessage(null);

      if (validFiles.length === 0) {
        clearSelection();
        setError(
          invalidFileNames.length > 0
            ? `File${invalidFileNames.length === 1 ? '' : 's'} "${invalidFileNames.join(', ')}" exceed${
                invalidFileNames.length === 1 ? 's' : ''
              } ${maxSizeMB}MB limit.`
            : 'No valid files selected.',
        );
        return;
      }

      setError(
        invalidFileNames.length > 0
          ? `Skipped oversized file${invalidFileNames.length === 1 ? '' : 's'}: ${invalidFileNames.join(', ')}.`
          : null,
      );
      const transformedFiles: SelectedFile[] = validFiles.map((file) => ({
        id: crypto.randomUUID(),
        file: file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      }));
      setSelectedFiles(transformedFiles);

      onFilesSelected?.(validFiles);
    },
    [clearSelection, maxSizeMB, onFilesSelected],
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

  const clearSelection = useCallback(() => {
    // Revoke preview URLs to free memory
    selectedFiles.forEach(revokePreview);
    setSelectedFiles([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [selectedFiles]);

  const handleRemoveFile = useCallback(
    (id: string) => {
      setSelectedFiles((prevFiles) => {
        const fileToRemove = prevFiles.find((f) => f.id === id);
        if (fileToRemove) {
          revokePreview(fileToRemove);
        }
        return prevFiles.filter((f) => f.id !== id);
      });
    },
    []
  );

  const handleRemove = useCallback(() => {
    clearSelection();
    setError(null);
    setMessage(null);
  }, [clearSelection]);

  useEffect(() => {
    return () => {
      selectedFilesRef.current.forEach(revokePreview);
    };
  }, []);

  return (
    <div>
      <label htmlFor="file-upload-input">Select {multiple ? 'files' : 'a file'}</label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        aria-describedby={`${errorId} ${statusId}`}
        aria-invalid={Boolean(error)}
        onChange={handleFileChange}
      />
      {error && (
        <p id="file-upload-error" role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}
      {message && <p id="file-upload-status" role="status">{message}</p>}
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