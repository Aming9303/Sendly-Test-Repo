import React from "react";
import { useFileUpload, UseFileUploadOptions } from "../lib/useFileUpload";

export interface FileItem {
  id: string;
  file: File;
  previewUrl: string;
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

const DEFAULT_MAX_SIZE_MB = 10;

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = "image/*,.pdf,.doc,.docx",
  maxSizeMB = 5,
  multiple = false,
  uploadUrl,
  onFilesSelected,
  onUploadSuccess,
  onUploadError,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of files) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          errors.push(`File "${file.name}" exceeds ${maxSizeMB}MB limit.`);
          continue;
        }
        validFiles.push(file);
      }

      setMessage(null);

      if (validFiles.length === 0) {
        setError(errors.length > 0 ? errors.join(' ') : 'No valid files selected.');
        selectedFiles.forEach((item) => {
          if (item.previewUrl) {
            URL.revokeObjectURL(item.previewUrl);
          }
        });
        setSelectedFiles([]);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
        return;
      }

      setError(errors.length > 0 ? errors.join(' ') : null);

      selectedFiles.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });

      const newItems: FileItem[] = validFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      }));

      setSelectedFiles(newItems);
      onFilesSelected?.(validFiles);
    },
    [maxSizeMB, onFilesSelected, selectedFiles],
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

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsUploading(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      const fieldName = multiple ? 'files' : 'file';

      for (const item of selectedFiles) {
        formData.append(fieldName, item.file, item.file.name);
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status >= 400 && response.status < 500) {
          throw new Error('Client error: upload could not be processed. Please check your files and try again.');
        } else if (response.status >= 500) {
          throw new Error('Server error: upload failed due to a server issue. Please try again later.');
        } else {
          throw new Error('Upload failed. Please try again.');
        }
      }

      setMessage('Upload successful!');
      onUploadSuccess?.();
    } catch (err) {
      console.error('Upload error:', err);
      let uploadError = 'Upload failed. Please check your connection and try again.';
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        uploadError = 'You appear to be offline. Please check your internet connection and try again.';
      } else if (err instanceof TypeError && /failed to fetch|network|fetch/i.test(err.message)) {
        uploadError = 'Network error: unable to reach the server. Please check your connection and try again.';
      } else if (err instanceof Error) {
        uploadError = err.message;
      }
      setError(uploadError);
      onUploadError?.(uploadError);
    } finally {
      if (!controller.signal.aborted) {
        setIsUploading(false);
      }
    }
  }, [multiple, onUploadError, onUploadSuccess, selectedFiles, uploadUrl]);

  const handleRemove = useCallback(() => {
    selectedFiles.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setSelectedFiles([]);
    setError(null);
    setMessage(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [selectedFiles]);

  const handleRemoveFile = useCallback(
    (idToRemove: string) => {
      setSelectedFiles((prev) => {
        const itemToRemove = prev.find((item) => item.id === idToRemove);
        if (itemToRemove && itemToRemove.previewUrl) {
          URL.revokeObjectURL(itemToRemove.previewUrl);
        }
        const updated = prev.filter((item) => item.id !== idToRemove);
        if (updated.length === 0 && inputRef.current) {
          inputRef.current.value = '';
        }
        onFilesSelected?.(updated.map((item) => item.file));
        return updated;
      });
    },
    [onFilesSelected],
  );

  useEffect(() => {
    return () => {
      selectedFiles.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [selectedFiles]);

  return (
    <div>
      <label htmlFor="file-upload-input">Choose file</label>
      <input
        id="file-upload-input"
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        aria-label="Choose file"
        aria-describedby={[
          error ? 'file-upload-error' : null,
          message ? 'file-upload-status' : null,
        ]
          .filter(Boolean)
          .join(' ') || undefined}
        onChange={handleFileChange}
      />
      {error && (
        <p id="file-upload-error" role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}
      {message && (
        <p id="file-upload-status" role="status">
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
          <button type="button" onClick={handleRemove} disabled={isUploading}>
            Remove all
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
          ) : null}
        </>
      )}
    </div>
  );
};
