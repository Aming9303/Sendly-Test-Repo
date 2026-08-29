export declare class UploadHttpError extends Error {
  readonly status: number;
  constructor(status: number);
}

export declare function getFriendlyUploadErrorMessage(error: unknown): string;
