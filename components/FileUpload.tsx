import React from "react";
import { useFileUpload, UseFileUploadOptions } from "../lib/useFileUpload";

export interface FileItem {
  id: string;
  file: File;
  previewUrl: string;
}

export interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  uploadUrl?: string;
  onFilesSelected?: (files: File[]) => void;
  onUploadSuccess?: () => void;
  onUploadError?: (message: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = 'image/*,.pdf,.doc,.docx',
  maxSizeMB = 5,
  multiple = false,
  uploadUrl,
  onFilesSelected,
  onUploadSuccess,
  onUploadError,
}) => {
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
          <button type="button" onClick={handleRemove} disabled={isUploading}>
            Remove all
          </button>
          {uploadUrl ? (
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
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
