// Maps backend error codes/messages to user-friendly messages

interface ErrorWithCode {
  code?: string;
  message?: string;
}

const errorMap: Record<string, string> = {
  NETWORK_ERROR: "Unable to connect. Please check your internet connection.",
  INVALID_CREDENTIALS: "Incorrect username or password.",
  USER_NOT_FOUND: "User not found. Please check the details and try again.",
  PROJECT_NOT_FOUND: "Project not found. Please refresh or contact support.",
  VALIDATION_ERROR: "Some fields are invalid. Please review and try again.",
  SERVER_ERROR: "Something went wrong on our end. Please try again later.",
  // Add more mappings as needed
};

export function getFriendlyErrorMessage(
  error: string | ErrorWithCode | null | undefined,
): string {
  if (!error) return "An unknown error occurred.";

  // If error is a string and matches a key
  if (typeof error === "string") {
    const message = errorMap[error];
    if (message) return message;
  }

  // If error is an object with code
  if (typeof error === "object" && error.code) {
    const message = errorMap[error.code];
    if (message) return message;
  }

  // If error is an object with message
  if (typeof error === "object" && error.message) {
    const message = errorMap[error.message];
    if (message) return message;
  }

  // Fallback to generic message
  return "An error occurred. Please try again.";
}
