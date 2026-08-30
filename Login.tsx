import React, { useRef } from "react";
import { useFileUpload } from "./lib/useFileUpload";

export interface IncorrectUploadProps {
  uploadUrl?: string;
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

export const IncorrectUpload: React.FC<IncorrectUploadProps> = ({
  uploadUrl = getDefaultUploadUrl(),
  maxSizeMB = 5,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadInFlightRef = useRef(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setMessage(null);
    setError(null);

    if (selectedFile && selectedFile.size > maxSizeMB * 1024 * 1024) {
      setFile(null);
      event.target.value = "";
      setError(
        `File "${selectedFile.name}" is too large. The maximum size is ${maxSizeMB} MB.`,
      );
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    const endpoint = uploadUrl.trim();

    if (!endpoint) {
      setError("Upload URL is not configured.");
      return;
    }

    if (!file) {
      setError("Please select a file before uploading.");
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
      formData.append("file", file, file.name);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      setMessage("Upload successful.");
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setError(message);
      console.error("Error:", err);
    } finally {
      uploadInFlightRef.current = false;
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" onChange={handleFileChange} />
      <button type="button" onClick={handleUpload} disabled={!file || isUploading}>
        {isUploading ? "Uploading..." : "Upload"}
      </button>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
};
