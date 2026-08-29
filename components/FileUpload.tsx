import React, { useState, useCallback, useRef, useEffect } from 'react';

const DEFAULT_MAX_SIZE_MB = 5;

export interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  uploadUrl?: string;
  onFilesSelected?: (files: File[]) => void;
  onUploadSuccess?: () => void;
  onUploadError?: (message: string) => void;
}

export interface SelectedFile {
  id: string;
  file: File;
  previewUrl: string;
}

const DEFAULT_MAX_SIZE_MB = 10;

const isFileTypeAccepted = (file: File, accept: string): boolean => {
  if (!accept || accept.trim() === '') return true;
  const rules = accept.split(',').map((rule) => rule.trim().toLowerCase());
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return rules.some((rule) => {
    if (rule.startsWith('.')) {
      return fileName.endsWith(rule);
    }
    if (rule.endsWith('/*')) {
      const baseType = rule.slice(0, -2);
      return fileType.startsWith(baseType);
    }
    return fileType === rule;
  });
};

const revokePreview = (selectedFile: SelectedFile) => {
  if (selectedFile.previewUrl) {
    URL.revokeObjectURL(selectedFile.previewUrl);
  }
};

const isFileTypeAccepted = (file: File, accept: string): boolean => {
  const acceptedTypes = accept.split(',').map(t => t.trim());
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  return acceptedTypes.some(acceptedType => {
    if (acceptedType.startsWith('.')) {
      return fileName.endsWith(acceptedType.toLowerCase());
    }
    if (acceptedType.endsWith('/*')) {
      const prefix = acceptedType.slice(0, -2);
      return fileType.startsWith(prefix);
    }
    return fileType === acceptedType;
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
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadInFlightRef = useRef(false);
  const selectedFilesRef = useRef<SelectedFile[]>([]);

  useEffect(() => {
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);

  useEffect(() => {
    return () => {
      selectedFilesRef.current.forEach(revokePreview);
    };
  }, []);

  const clearSelection = useCallback(() => {
    selectedFiles.forEach(revokePreview);
    setSelectedFiles([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onFilesSelected?.([]);
  }, [selectedFiles, onFilesSelected]);

  const handleRemoveFile = useCallback(
    (id: string) => {
      setSelectedFiles((prev) => {
        const toRemove = prev.find((item) => item.id === id);
        if (toRemove) {
          revokePreview(toRemove);
        }
        const updated = prev.filter((item) => item.id !== id);
        onFilesSelected?.(updated.map((item) => item.file));
        return updated;
      });
    },
    [onFilesSelected],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const maxBytes = maxSizeMB * 1024 * 1024;
      const validFiles: File[] = [];
      const invalidFileNames: string[] = [];
      const typeErrors: string[] = [];

      for (const file of files) {
        if (file.size > maxBytes) {
          invalidFileNames.push(file.name);
          continue;
        }

        if (!isFileTypeAccepted(file, accept)) {
          typeErrors.push(file.name);
          continue;
        }

        validFiles.push(file);
      }

      setMessage(null);

      if (validFiles.length === 0) {
        clearSelection();
        if (invalidFileNames.length > 0) {
          setError(
            `File${invalidFileNames.length === 1 ? '' : 's'} "${invalidFileNames.join(', ')}" exceed${
              invalidFileNames.length === 1 ? 's' : ''
            } ${maxSizeMB}MB limit.`,
          );
        } else if (typeErrors.length > 0) {
          setError(
            `File${typeErrors.length === 1 ? '' : 's'} "${typeErrors.join(', ')}" not accepted. Allowed types: ${accept}.`,
          );
        } else {
          setError('No valid files selected.');
        }
        return;
      }

      // Cleanup old previews if replacing
      selectedFiles.forEach(revokePreview);

      const newSelectedFiles: SelectedFile[] = validFiles.map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      }));

      setSelectedFiles(newSelectedFiles);

      if (invalidFileNames.length > 0 || typeErrors.length > 0) {
        const issues: string[] = [];
        if (invalidFileNames.length > 0) issues.push(`oversized: ${invalidFileNames.join(', ')}`);
        if (typeErrors.length > 0) issues.push(`invalid type: ${typeErrors.join(', ')}`);
        setError(`Skipped ${issues.join('; ')}.`);
      } else {
        setError(null);
      }

      onFilesSelected?.(validFiles);
    },
    [accept, clearSelection, maxSizeMB, onFilesSelected, selectedFiles],
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

      for (const selectedFile of selectedFiles) {
        formData.append(fieldName, selectedFile.file, selectedFile.file.name);
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

  const clearSelection = useCallback(() => {
    // Revoke preview URLs to free memory
    selectedFiles.forEach(revokePreview);
    setSelectedFiles([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [selectedFiles]);

  const handleRemoveFile = useCallback(
    (id: string) => {
      setSelectedFiles((prevFiles) => {
        const fileToRemove = prevFiles.find((f) => f.id === id);
        if (fileToRemove) {
          revokePreview(fileToRemove);
        }
        return prevFiles.filter((f) => f.id !== id);
      });
    },
    []
  );

  const handleRemove = useCallback(() => {
    clearSelection();
    setError(null);
    setMessage(null);
  }, [clearSelection]);

  const inputId = 'file-upload-input';
  const errorId = 'file-upload-error';

  return (
    <div>
      <label htmlFor="file-upload-input">Select {multiple ? 'files' : 'a file'}</label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        onChange={handleFileChange}
      />
      {error && (
        <p id="file-upload-error" role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}
      {message && <p id="file-upload-status" role="status">{message}</p>}
      {selectedFiles.map((item) => (
        <div key={item.id}>
          {item.previewUrl && (
            <img
              src={item.previewUrl}
              alt="preview"
              style={{ width: 100, height: 100, objectFit: 'cover' }}
            />
          )}
          {multiple && (
            <button
              type="button"
              onClick={() => handleRemoveFile(item.id)}
              disabled={isUploading}
              aria-label={`Remove ${item.file.name}`}
            >
              Remove {item.file.name}
            </button>
          )}
        </div>
      ))}
      {selectedFiles.length > 0 && (
        <>
          <button type="button" onClick={handleRemove} disabled={isUploading}>
            {multiple ? 'Remove all' : 'Remove'}
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
    </div>
  );
};
