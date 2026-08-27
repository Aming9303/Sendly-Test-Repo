import React, { useRef, useState } from "react";

export const IncorrectUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isUploadingRef = useRef(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
    setMessage(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (isUploadingRef.current) {
      return;
    }

    if (!file) {
      setError('Please select a file before uploading');
      return;
    }

    isUploadingRef.current = true;
    setIsUploading(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const response = await fetch('https://example.com', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      setMessage('Upload successful!');
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'File upload failed';
      setError(msg);
      console.error('Error:', err);
    } finally {
      isUploadingRef.current = false;
      setIsUploading(false);
    }
  };

  return (
    <div>
      <label htmlFor="upload-file-input">Select file</label>
      <input
        ref={inputRef}
        id="upload-file-input"
        type="file"
        onChange={handleFileChange}
        aria-describedby="upload-file-status upload-file-error"
      />
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || isUploading}
        aria-busy={isUploading}
        aria-describedby="upload-file-status"
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
      {message && (
        <p id="upload-file-status" role="status">
          {message}
        </p>
      )}
      {error && (
        <p id="upload-file-error" role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}
    </div>
  );
};
