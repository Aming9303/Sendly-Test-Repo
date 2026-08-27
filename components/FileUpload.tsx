import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';

declare const process: { env: { NODE_ENV?: string } };

const DEFAULT_MAX_SIZE_MB = 5;

const normalizeMaxSizeMB = (value: number) => {
  if (Number.isFinite(value) && value > 0) {
    return value;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[FileUpload] Invalid maxSizeMB value ${String(value)}; falling back to ${DEFAULT_MAX_SIZE_MB}MB.`,
    );
  }

  return DEFAULT_MAX_SIZE_MB;
};

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
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  multiple = false,
  uploadUrl,
  onFilesSelected,
  onUploadSuccess,
  onUploadError,
}) => {
  const safeMaxSizeMB = useMemo(() => normalizeMaxSizeMB(maxSizeMB), [maxSizeMB]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = `${inputId}-error`;
  const statusId = `${inputId}-status`;
  const describedBy = [error ? errorId : null, message ? statusId : null]
    .filter(Boolean)
    .join(' ') || undefined;

  const validateAndSelectFiles = useCallback(
    (incomingFiles: File[]) => {
      const files = multiple ? incomingFiles : incomingFiles.slice(0, 1);
      const validFiles: File[] = [];
      const invalidFileNames: string[] = [];

      if (!multiple && incomingFiles.length > 1) {
        errors.push('Only one file can be selected.');
      }

      for (const file of files) {
        if (file.size > safeMaxSizeMB * 1024 * 1024) {
          errors.push(`File "${file.name}" exceeds ${safeMaxSizeMB}MB limit.`);
          continue;
        }

        if (!matchesAcceptedType(file, accept)) {
          errors.push(`File "${file.name}" is not an accepted file type.`);
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
    [onFilesSelected, safeMaxSizeMB],
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
    <div>
      <label htmlFor={inputId}>Select {multiple ? 'files' : 'a file'}</label>
      <input
        id={inputId}
        ref={inputRef}
        id="file-upload-input"
        type="file"
        accept={accept}
        multiple={multiple}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        onChange={handleFileChange}
        aria-describedby="file-upload-error file-upload-status"
      />
      {error && (
        <p id={errorId} role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}
      {message && (
        <p id={statusId} role="status">
          {message}
        </p>
      )}
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
          <button
            type="button"
            onClick={handleRemove}
            disabled={isUploading}
            aria-label="Remove all selected files"
          >
            Remove
          </button>
          {uploadUrl && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              aria-busy={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          )}
        </>
      )}
    </form>
  );
};