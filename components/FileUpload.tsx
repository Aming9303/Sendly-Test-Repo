import React, { useId } from 'react';
import { useFileUpload } from '../lib/useFileUpload';

export interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  uploadUrl?: string;
  onFilesSelected?: (files: File[]) => void;
  onUploadSuccess?: () => void;
  onUploadError?: (message: string) => void;
}

const DEFAULT_MAX_SIZE_MB = 10;

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = 'image/*,.pdf,.doc,.docx',
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  multiple = false,
  uploadUrl,
  onFilesSelected,
  onUploadSuccess,
  onUploadError,
}) => {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const statusId = `${inputId}-status`;

  const {
    selectedFiles,
    previews,
    isUploading,
    message,
    error,
    inputRef,
    handleFileChange,
    handleUpload,
    handleRemove,
    uploadingRef,
  } = useFileUpload({
    accept,
    maxSizeMB,
    multiple,
    uploadUrl,
    onFilesSelected,
    onUploadSuccess,
    onUploadError,
  });

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
        <p id={errorId} role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}
      {message && (
        <p id={statusId} role="status">
          {message}
        </p>
      )}
      {selectedFiles.map((file, index) => (
        <div key={`${file.name}-${file.lastModified}-${index}`}>
          {previews[index] ? (
            <img
              src={previews[index]}
              alt="preview"
              style={{ width: 100, height: 100, objectFit: 'cover' }}
            />
          ) : null}
          <span>{file.name}</span>
        </div>
      ))}
      {selectedFiles.length > 0 && (
        <>
          <button type="button" onClick={handleRemove} disabled={isUploading || uploadingRef.current}>
            {multiple ? 'Remove all' : 'Remove'}
          </button>
          {uploadUrl ? (
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || uploadingRef.current}
              aria-busy={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
};
