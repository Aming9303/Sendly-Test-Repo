import React from "react";
import { useFileUpload } from "./lib/useFileUpload";

export const IncorrectUpload = () => {
  const {
    file,
    isUploading,
    message,
    error,
    inputRef,
    handleFileChange,
    handleUpload,
  } = useFileUpload({
    uploadUrl: "https://example.com",
  });

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
