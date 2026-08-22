import React from "react";
import { useFileUpload, UseFileUploadOptions } from "../lib/useFileUpload";

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
  accept = "image/*,.pdf,.doc,.docx",
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
    error,
    isUploading,
    message,
    inputRef,
    handleFileChange,
    handleUpload,
    handleRemove,
  } = useFileUpload({
    uploadUrl,
    maxSizeMB,
    multiple,
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
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {previews.map((url, idx) =>
        url ? (
          <img
            key={idx}
            src={url}
            alt="preview"
            style={{ width: 100, height: 100, objectFit: "cover" }}
          />
        ) : null,
      )}
      {selectedFiles.length > 0 && (
        <>
          <button type="button" onClick={handleRemove} disabled={isUploading}>
            Remove
          </button>
          {uploadUrl && (
            <button type="button" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          )}
        </>
      )}
    </div>
  );
};
