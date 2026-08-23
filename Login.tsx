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
        const userMessage =
          response.status >= 400 && response.status < 500
            ? "We couldn't upload that file. Check it and try again."
            : response.status >= 500
              ? "The upload service is temporarily unavailable. Please try again later."
              : "The upload could not be completed. Please try again.";

        console.error("Upload request failed:", {
          status: response.status,
          statusText: response.statusText,
        });
        setError(userMessage);
        return;
      }

      setMessage("Upload successful.");
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err) {
      console.error("Upload request failed:", err);

      const isOffline =
        typeof navigator !== "undefined" && navigator.onLine === false;
      const userMessage = isOffline
        ? "You're offline. Check your internet connection and try again."
        : err instanceof TypeError
          ? "We couldn't reach the upload service. Check your connection and try again."
          : "Something went wrong while uploading. Please try again.";
      setError(userMessage);
    } finally {
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
