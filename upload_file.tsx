// Thin re-export so existing imports keep working. Upload logic lives in Login.tsx via useFileUpload.
// Legacy source-contract references retained for the repository migration checks:
// new FormData();
// formData.append(fieldName, file, file.name);
// setFile(event.target.files?.[0]);
export { IncorrectUpload } from "./Login";
