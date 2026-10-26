
const API_BASE_URL = "http://localhost:8000/api/auth/";

async function getCsrfToken() {
  const response = await fetch(`${API_BASE_URL}csrf/`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.csrfToken) {
    throw new Error(
      "Could not get security token. Please refresh and try again."
    );
  }

  return data.csrfToken;
}

export async function apiRequest(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  // Let the browser set the multipart boundary for file uploads.
  if (isFormData) {
    delete headers["Content-Type"];
    delete headers["content-type"];
  }

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    headers["X-CSRFToken"] = await getCsrfToken();
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data.detail ||
      Object.entries(data)
        .map(([key, value]) =>
          `${key}: ${
            Array.isArray(value)
              ? value.join(", ")
              : typeof value === "object" && value !== null
                ? JSON.stringify(value)
                : value
          }`
        )
        .join("; ") ||
      `Request failed (${response.status})`;

    throw new Error(message);
  }

  return data;
}