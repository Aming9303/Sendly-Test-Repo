import React from 'react';
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

export const isFileTypeAccepted = (file: File, accept?: string): boolean => {
  if (!accept || !accept.trim()) return true;
  const tokens = accept.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (tokens.length === 0) return true;

  const fileName = file.name.toLowerCase();
  const fileType = (file.type || '').toLowerCase();

  return tokens.some((token) => {
    if (token.startsWith('.')) {
      return fileName.endsWith(token);
    }
    if (token.endsWith('/*')) {
      const typePrefix = token.slice(0, -2);
      return fileType.startsWith(typePrefix + '/');
    }
    return fileType === token;
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
  const {
    selectedFiles,
    previews,
    error,
    isUploading,
    message,
    inputRef,
    handleFileChange,
    handleUpload,
    handleRemove,
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
      <label htmlFor={inputId}>Select {multiple ? 'files' : 'a file'}</label>
      <input
        id={inputId}
        ref={inputRef}
        id="file-upload-input"
        type="file"
        accept={accept}
        multiple={multiple}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        onChange={handleFileChange}
        aria-describedby="file-upload-error file-upload-status"
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
      {previews.map((url, idx) =>
        url ? (
          <img
            key={idx}
            src={url}
            alt="preview"
            style={{ width: 100, height: 100, objectFit: 'cover' }}
          />
        ) : null,
      )}
      {selectedFiles.length > 0 && (
        <>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isUploading}
            aria-label="Remove all selected files"
          >
            Remove
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
    </form>
  );
};