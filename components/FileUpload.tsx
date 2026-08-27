import React, { useState, useCallback, useRef, useEffect } from 'react';
/**
 * Validates and coerces the maxSizeMB prop to a safe positive number.
 * - NaN, 0, or negative values fall back to DEFAULT_MAX_SIZE_MB (5) with a console.warn in dev.
 * - Production builds stay silent.
 */
const DEFAULT_MAX_SIZE_MB = 5;

function sanitizeMaxSizeMB(value: unknown): number {
  const num = Number(value);
  if (Number.isFinite(num) && num > 0) {
    return num;
  }
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[FileUpload] Invalid maxSizeMB prop: ${JSON.stringify(value)} (${Number.isNaN(num) ? 'NaN' : num}). Falling back to ${DEFAULT_MAX_SIZE_MB}.`,
    );
  }
  return DEFAULT_MAX_SIZE_MB;
}


export interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  uploadUrl?: string;
  onFilesSelected?: (files: File[]) => void;
  onUploadSuccess?: () => void;
  onUploadError?: (message: string) => void;
}

export const isFileTypeAccepted = (file: File, accept?: string): boolean => {
  if (!accept || !accept.trim()) return true;
  const tokens = accept.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (tokens.length === 0) return true;

  const fileName = file.name.toLowerCase();
  const fileType = (file.type || '').toLowerCase();

  return tokens.some((token) => {
    if (token.startsWith('.')) {
      return fileName.endsWith(token);
    }
    if (token.endsWith('/*')) {
      const typePrefix = token.slice(0, -2);
      return fileType.startsWith(typePrefix + '/');
    }
    return fileType === token;
  });
};

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = 'image/*,.pdf,.doc,.docx',
  maxSizeMB: rawMaxSizeMB = DEFAULT_MAX_SIZE_MB,
  multiple = false,
  uploadUrl,
  onFilesSelected,
  onUploadSuccess,
  onUploadError,
}) => {
  const maxSizeMB = sanitizeMaxSizeMB(rawMaxSizeMB);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadInFlightRef = useRef(false);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const maxBytes = maxSizeMB * 1024 * 1024;
      const validFiles: File[] = [];
      const invalidFileNames: string[] = [];

      for (const file of files) {
        if (file.size > maxBytes) {
          invalidFileNames.push(file.name);
          continue;
        }
        validFiles.push(file);
      }

      setMessage(null);

      if (validFiles.length === 0) {
        setError(
          invalidFileNames.length > 0
            ? `File${invalidFileNames.length > 1 ? 's' : ''} "${invalidFileNames.join(', ')}" exceed${
                invalidFileNames.length > 1 ? '' : 's'
              } ${maxSizeMB}MB limit.`
            : 'No valid files selected.'
        );
        clearSelection();
        return;
      }

      setError(
        invalidFileNames.length > 0
          ? `Skipped file${invalidFileNames.length > 1 ? 's' : ''} "${invalidFileNames.join(', ')}" because ${
              invalidFileNames.length > 1 ? 'they exceed' : 'it exceeds'
            } the ${maxSizeMB}MB limit.`
          : null
      );
      setSelectedFiles(validFiles);

      const newPreviews = validFiles.map((file) => {
        if (file.type.startsWith('image/')) {
          return URL.createObjectURL(file);
        }
        return '';
      });
      setPreviews(newPreviews);

      onFilesSelected?.(validFiles);
    },
    [clearSelection, maxSizeMB, onFilesSelected],
  );

  const handleUpload = useCallback(async () => {
    if (isUploadingRef.current) {
      return;
    }

    if (!uploadUrl) {
      setError('Upload URL is not configured.');
      return;
    }

    if (selectedFiles.length === 0) {
      setError('Please select a file before uploading.');
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
      const fieldName = multiple ? 'files' : 'file';

      for (const file of selectedFiles) {
        formData.append(fieldName, file, file.name);
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      setMessage('Upload successful!');
      onUploadSuccess?.();
    } catch (err) {
      const uploadError = err instanceof Error ? err.message : 'Upload failed.';
      setError(uploadError);
      onUploadError?.(uploadError);
      console.error('Upload error:', err);
    } finally {
      uploadInFlightRef.current = false;
      setIsUploading(false);
    }
  }, [multiple, onUploadError, onUploadSuccess, selectedFiles, uploadUrl]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (selectedFiles.length === 0 || uploadInFlightRef.current) {
        return;
      }

      void handleUpload();
    },
    [handleUpload, selectedFiles.length],
  );

  const handleRemove = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Per-file removal: only used in multiple mode
  const handleRemoveFile = useCallback(
    (index: number) => {
      // Revoke object URL for the removed file preview
      if (previews[index]) {
        URL.revokeObjectURL(previews[index]);
      }
      setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
      setPreviews((prev) => {
        const updated = prev.filter((_, i) => i !== index);
        return updated;
      });
    },
    [previews],
  );

  // Generate stable keys for files based on file identity (name + size + lastModified)
  const fileKey = useCallback((file: File, index: number) => {
    return `${file.name}-${file.size}-${file.lastModified}-${index}`;
  }, []);

  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previews]);

  return (
    <form onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        id="file-upload-input"
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        aria-describedby="file-upload-error file-upload-status"
      />
      {error && (
        <p id="file-upload-error" role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {previews.map((url, idx) => {
        const key = fileKey(selectedFiles[idx], idx);
        return (
          <div key={key} style={{ display: 'inline-block', margin: '4px', position: 'relative' }}>
            {url ? (
              <img
                src={url}
                alt="preview"
                style={{ width: 100, height: 100, objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: 100,
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f0f0f0',
                  fontSize: 12,
                  textAlign: 'center',
                  padding: 4,
                }}
              >
                {selectedFiles[idx]?.name}
              </div>
            )}
            {multiple && (
              <button
                type="button"
                onClick={() => handleRemoveFile(idx)}
                disabled={isUploading}
                aria-label={`Remove ${selectedFiles[idx]?.name || 'file'}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  background: 'rgba(255,0,0,0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  cursor: 'pointer',
                  fontSize: 12,
                  lineHeight: '20px',
                  textAlign: 'center',
                  padding: 0,
                }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
      {selectedFiles.length > 0 && (
        <>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isUploading}
            aria-label="Remove all selected files"
          >
            Remove
          </button>
          {uploadUrl && (
            <button type="submit" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          )}
        </>
      )}
    </form>
  );
};