import React, { useRef, useState } from "react";

export const IncorrectUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);

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

    // Synchronous ref guard prevents re-entry before state flush
    if (uploadingRef.current) return;
    uploadingRef.current = true;

    setIsUploading(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const response = await fetch(
        (typeof process !== 'undefined' && process.env && process.env.SENDLY_UPLOAD_URL) ||
        (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_UPLOAD_URL) ||
        '/api/upload', {
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
      uploadingRef.current = false;
      setIsUploading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || isUploading) return;
    handleUpload();
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <input ref={inputRef} type="file" onChange={handleFileChange} />
      <button type="submit" disabled={!file || isUploading}>
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
    </form>
  );
};
