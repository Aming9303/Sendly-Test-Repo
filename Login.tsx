import React, { useId, useRef, useState } from "react";

export const IncorrectUpload = () => {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = `${inputId}-error`;
  const statusId = `${inputId}-status`;
  const describedBy = [error ? errorId : null, message ? statusId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
    setMessage(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file before uploading.");
      return;
    }

    setIsUploading(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file, file.name);

      const response = await fetch("https://example.com", {
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
      setIsUploading(false);
    }
  };

  return (
    <div>
      <label htmlFor={inputId}>Select a file</label>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
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
      {message && (
        <p id={statusId} role="status">
          {message}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
