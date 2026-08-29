class UploadHttpError extends Error {
  constructor(status) {
    super(`Upload failed with status ${status}`);
    this.name = 'UploadHttpError';
    this.status = status;
  }
}

function getFriendlyUploadErrorMessage(error) {
  if (error instanceof UploadHttpError) {
    if (error.status >= 500) {
      return 'Upload service is temporarily unavailable. Please try again later.';
    }
    if (error.status >= 400) {
      return 'Upload failed. Please check your file and try again.';
    }
  }

  if (error instanceof TypeError) {
    return 'Network error. Please check your connection and try again.';
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes('failed to fetch') ||
      message.includes('networkerror') ||
      message.includes('network request failed') ||
      message.includes('load failed')
    ) {
      return 'Network error. Please check your connection and try again.';
    }
  }

  return 'Upload failed. Please try again.';
}

module.exports = { UploadHttpError, getFriendlyUploadErrorMessage };
