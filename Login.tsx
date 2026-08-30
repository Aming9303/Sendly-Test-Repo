import React, { useRef, useState } from "react";
import { useFileUpload } from "./lib/useFileUpload";

export interface IncorrectUploadProps {
  uploadUrl?: string;
}

type SendlyRuntime = typeof globalThis & {
  __SENDLY_CONFIG__?: { uploadUrl?: string };
  process?: { env?: { SENDLY_UPLOAD_URL?: string; REACT_APP_UPLOAD_URL?: string } };
};

const getDefaultUploadUrl = () => {
  const runtime = globalThis as SendlyRuntime;
  return (
    runtime.__SENDLY_CONFIG__?.uploadUrl ??
    runtime.process?.env?.SENDLY_UPLOAD_URL ??
    runtime.process?.env?.REACT_APP_UPLOAD_URL ??
    ""
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

  useFileUpload({ uploadUrl, maxSizeMB });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;

    if (selectedFile && selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`The maximum size is ${maxSizeMB} MB`);
      setFile(null);
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    setMessage(null);
    setError(null);
  };

  const handleUpload = async () => {
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

    const endpoint = uploadUrl.trim();

    if (!endpoint) {
      setError("Upload URL is not configured.");
      uploadInFlightRef.current = false;
      setIsUploading(false);
      return;
    }

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
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || isUploading || uploadingRef.current}
      >
        {isUploading ? "Uploading..." : "Upload"}
      </button>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
};
