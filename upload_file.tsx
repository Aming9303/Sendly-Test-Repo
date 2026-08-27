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
    .join(' ') || undefined;

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
        const userMessage =
          response.status >= 400 && response.status < 500
            ? 'We could not upload that file. Check it and try again.'
            : response.status >= 500
              ? 'The upload service is temporarily unavailable. Please try again later.'
              : 'The upload could not be completed. Please try again.';

        console.error('Upload request failed:', {
          status: response.status,
          statusText: response.statusText,
        });
        setError(userMessage);
        return;
      }

      setMessage('Upload successful!');
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (err) {
      console.error('Upload request failed:', err);

      const isOffline =
        typeof navigator !== 'undefined' && navigator.onLine === false;
      const userMessage = isOffline
        ? "You're offline. Check your internet connection and try again."
        : err instanceof TypeError
          ? 'We could not reach the upload service. Check your connection and try again.'
          : 'Something went wrong while uploading. Please try again.';
      setError(userMessage);
    } finally {
      uploadingRef.current = false;
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
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
      {message && (
        <p id={statusId} role="status">
          {message}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}
    </div>
  );
};
