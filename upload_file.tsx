import React, { useRef, useState, useEffect } from "react";

export const IncorrectUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
    setMessage(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file before uploading');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsUploading(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const response = await fetch('https://example.com', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      setMessage('Upload successful!');
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'File upload failed';
      setError(msg);
      console.error('Error:', err);
    } finally {
      if (!controller.signal.aborted) {
        setIsUploading(false);
      }
    }
  };

  return (
    <div>
      <label htmlFor="upload-file-input">Choose file</label>
      <input
        id="upload-file-input"
        ref={inputRef}
        type="file"
        aria-label="Choose file"
        aria-describedby={[
          error ? 'upload-file-error' : null,
          message ? 'upload-file-status' : null,
        ]
          .filter(Boolean)
          .join(' ') || undefined}
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || isUploading}
        aria-busy={isUploading}
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
