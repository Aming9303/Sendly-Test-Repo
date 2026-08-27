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
  const isUploadingRef = useRef(false);

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
    setPreviews([]);
    setError(null);
    setMessage(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
    setPreviews([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

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

    isUploadingRef.current = true;
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
      isUploadingRef.current = false;
      setIsUploading(false);
    }
  }, [multiple, onUploadError, onUploadSuccess, selectedFiles, uploadUrl]);

  const handleRemove = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

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
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
      />
      {error && (
        <p role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {previews.map((url, idx) =>
        url ? (
          <img
            key={idx}
            src={url}
            alt="preview"
            style={{ width: 100, height: 100, objectFit: 'cover' }}
          />
        ) : null,
      )}
      {selectedFiles.length > 0 && (
        <>
          <button type="button" onClick={handleRemove} disabled={isUploading}>
            Remove
          </button>
          {uploadUrl && (
            <button type="button" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          )}
        </>
      )}
    </div>
  );
};
