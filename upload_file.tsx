import React, { useRef, useState } from "react";

export const IncorrectUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        if (response.status >= 400 && response.status < 500) {
          throw new Error('Client error: request could not be processed. Please check your file and try again.');
        } else if (response.status >= 500) {
          throw new Error('Server error: something went wrong on our end. Please try again later.');
        } else {
          throw new Error('Upload failed. Please try again.');
        }
      }

      setMessage('Upload successful!');
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error:', err);
      let msg = 'File upload failed';
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        msg = 'You appear to be offline. Please check your internet connection and try again.';
      } else if (err instanceof TypeError && /failed to fetch|network|fetch/i.test(err.message)) {
        msg = 'Network error: unable to reach the server. Please check your connection and try again.';
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" onChange={handleFileChange} />
      <button type="button" onClick={handleUpload} disabled={!file || isUploading}>
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};
