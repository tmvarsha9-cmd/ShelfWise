// Base HTTP client, ApiError definition, and mock switcher for StockSense

export class ApiError extends Error {
  constructor(message, status = 500, code = "UNKNOWN_ERROR", details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

/**
 * Standard fetch wrapper for backend endpoints.
 */
export async function request(path, options = {}) {
  const token = localStorage.getItem("stocksense_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorBody = {};
      try {
        errorBody = await response.json();
      } catch {
        errorBody = {};
      }

      let message = errorBody.message;
      let code = "HTTP_ERROR";
      let details = null;

      if (typeof errorBody.error === "string") {
        message = errorBody.error;
      } else if (errorBody.error && typeof errorBody.error === "object") {
        message = errorBody.error.message || message;
        code = errorBody.error.code || code;
        details = errorBody.error.details || null;
      }

      // Map status codes according to prompt specification
      if (response.status === 401) {
        message = message || "Your session has expired. Please sign in again.";
        code = "UNAUTHORIZED";
      } else if (response.status === 403) {
        message = message || "You do not have permission to perform this action.";
        code = "FORBIDDEN";
      } else if (response.status === 404) {
        message = message || "The requested resource was not found.";
        code = "NOT_FOUND";
      } else if (response.status === 409) {
        message = message || "Conflict or not enough stock for this operation.";
        code = "CONFLICT";
      } else if (response.status === 422) {
        message = message || "Please check the highlighted form fields.";
        code = "VALIDATION_ERROR";
      } else if (!message) {
        message = `Request failed (${response.status})`;
      }

      throw new ApiError(message, response.status, code, details);
    }

    if (response.status === 204) return null;
    return await response.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      err.message || "We couldn't connect to the server. Check your connection and try again.",
      0,
      "NETWORK_ERROR"
    );
  }
}