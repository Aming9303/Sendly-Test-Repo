// Thin re-export so existing imports keep working. Upload logic (including
// AbortController cancellation on unmount) lives in Login.tsx via useFileUpload.
export { IncorrectUpload } from "./Login";
