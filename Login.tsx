import React, { useRef } from "react";
import { useFileUpload } from "./lib/useFileUpload";

export interface LoginUploadProps {
  endpoint?: string;
  maxSizeMB?: number;
}

export const IncorrectUpload: React.FC<LoginUploadProps> = ({
  endpoint = "https://example.com",
  maxSizeMB = 5,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    selectedFiles,
    isUploading,
    statusMessage,
    errorMessage,
    handleFileChange: onFileChange,
    uploadFiles,
  } = useFileUpload({
    endpoint,
    maxSizeMB,
    multiple: false,
  });

  const file = selectedFiles[0] ?? null;
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFileChange(event);
  };

  const handleUpload = async () => {
    await uploadFiles();
  };

  return (
    <div>
      <label htmlFor="login-file-input">Choose file</label>
      <input
        id="login-file-input"
        ref={inputRef}
        type="file"
        aria-label="Choose file"
        aria-describedby={[
          errorMessage ? "login-file-error" : null,
          statusMessage ? "login-file-status" : null,
        ]
          .filter(Boolean)
          .join(" ") || undefined}
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || isUploading}
        aria-busy={isUploading}
      >
        {isUploading ? "Uploading..." : "Upload"}
      </button>
      {statusMessage && (
        <p id="login-file-status" role="status">
          {statusMessage}
        </p>
      )}
      {errorMessage && (
        <p id="login-file-error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
