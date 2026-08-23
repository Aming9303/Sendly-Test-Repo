import React, { useState, useCallback, useRef, useEffect } from 'react';

const matchesAcceptedType = (file: File, accept: string) => {
  if (accept.trim() === '') {
    return true;
  }

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return accept.split(',').some((rawToken) => {
    const token = rawToken.trim().toLowerCase();

    if (token.startsWith('.')) {
      return fileName.endsWith(token);
    }

    if (token.endsWith('/*')) {
      return fileType.startsWith(token.slice(0, -1));
    }

    return fileType === token;
  });
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

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = 'image/*,.pdf,.doc,.docx',
  maxSizeMB = 5,
  multiple = false,
  uploadUrl,
  onFilesSelected,
  onUploadSuccess,
  onUploadError,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelectFiles = useCallback(
    (incomingFiles: File[]) => {
      const files = multiple ? incomingFiles : incomingFiles.slice(0, 1);
      const validFiles: File[] = [];
      const errors: string[] = [];

      if (!multiple && incomingFiles.length > 1) {
        errors.push('Only one file can be selected.');
      }

      for (const file of files) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          errors.push(`File "${file.name}" exceeds ${maxSizeMB}MB limit.`);
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
        setError(errors.length > 0 ? errors.join(' ') : 'No valid files selected.');
        setSelectedFiles([]);
        setPreviews([]);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
        return;
      }

      setError(errors.length > 0 ? errors.join(' ') : null);
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
    [accept, maxSizeMB, multiple, onFilesSelected],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      validateAndSelectFiles(Array.from(event.target.files || []));
    },
    [validateAndSelectFiles],
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      validateAndSelectFiles(Array.from(event.dataTransfer.files || []));
    },
    [validateAndSelectFiles],
  );

  const handleUpload = useCallback(async () => {
    if (!uploadUrl) {
      setError('Upload URL is not configured.');
      return;
    }

    if (selectedFiles.length === 0) {
      setError('Please select a file before uploading.');
      return;
    }

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
      setIsUploading(false);
    }
  }, [multiple, onUploadError, onUploadSuccess, selectedFiles, uploadUrl]);

  const handleRemove = useCallback(() => {
    setSelectedFiles([]);
    setPreviews([]);
    setError(null);
    setMessage(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
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
    <div
      aria-label="File drop zone"
      data-drag-active={isDragging ? 'true' : 'false'}
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? '#2563eb' : '#9ca3af'}`,
        backgroundColor: isDragging ? '#eff6ff' : 'transparent',
        padding: 16,
        transition: 'border-color 120ms ease, background-color 120ms ease',
      }}
    >
      <p>{isDragging ? 'Drop files here.' : 'Drag and drop files here, or use the picker.'}</p>
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
