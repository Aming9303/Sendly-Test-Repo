import { useState, useCallback, useRef, useEffect } from "react";

export interface UseFileUploadOptions {
  uploadUrl?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  onFilesSelected?: (files: File[]) => void;
  onUploadSuccess?: () => void;
  onUploadError?: (message: string) => void;
}

export interface UseFileUploadReturn {
  file: File | null;
  selectedFiles: File[];
  previews: string[];
  isUploading: boolean;
  message: string | null;
  error: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpload: () => Promise<void>;
  handleRemove: () => void;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  setMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    uploadUrl,
    maxSizeMB,
    multiple = false,
    onFilesSelected,
    onUploadSuccess,
    onUploadError,
  } = options;

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const file = selectedFiles[0] ?? null;

  const setFile: React.Dispatch<React.SetStateAction<File | null>> = useCallback(
    (action) => {
      setSelectedFiles((prev) => {
        const currentFile = prev[0] ?? null;
        const nextFile = typeof action === "function" ? action(currentFile) : action;
        return nextFile ? [nextFile] : [];
      });
    },
    [],
  );

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
    setPreviews([]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of files) {
        if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
          errors.push(`File "${file.name}" exceeds ${maxSizeMB}MB limit.`);
          continue;
        }
        validFiles.push(file);
      }

      setMessage(null);

      if (validFiles.length === 0) {
        setError(errors.length > 0 ? errors.join(" ") : "No valid files selected.");
        clearSelection();
        return;
      }

      setError(errors.length > 0 ? errors.join(" ") : null);
      setSelectedFiles(validFiles);

      const newPreviews = validFiles.map((file) => {
        if (file.type.startsWith("image/")) {
          return URL.createObjectURL(file);
        }
        return "";
      });
      setPreviews(newPreviews);

      onFilesSelected?.(validFiles);
    },
    [maxSizeMB, onFilesSelected, clearSelection],
  );

  const handleUpload = useCallback(async () => {
    const targetUrl = uploadUrl || "https://example.com";

    if (selectedFiles.length === 0) {
      setError("Please select a file before uploading.");
      return;
    }

    if (isUploading) {
      return;
    }

    setIsUploading(true);
    setMessage(null);
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      const fieldName = multiple ? "files" : "file";

      for (const file of selectedFiles) {
        if (multiple) {
          formData.append(fieldName, file, file.name);
        } else {
          formData.append("file", file, file.name);
        }
      }

      const response = await fetch(targetUrl, {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      setMessage("Upload successful.");
      onUploadSuccess?.();
      clearSelection();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      const uploadError = err instanceof Error ? err.message : "Upload failed.";
      setError(uploadError);
      onUploadError?.(uploadError);
      console.error("Error:", err);
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  }, [uploadUrl, selectedFiles, isUploading, multiple, onUploadSuccess, onUploadError, clearSelection]);

  const handleRemove = useCallback(() => {
    setError(null);
    clearSelection();
  }, [clearSelection]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [previews]);

  return {
    file,
    selectedFiles,
    previews,
    isUploading,
    message,
    error,
    inputRef,
    handleFileChange,
    handleUpload,
    handleRemove,
    setFile,
    setMessage,
    setError,
  };
}
