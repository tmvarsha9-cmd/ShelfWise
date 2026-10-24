import { request, USE_MOCKS, ApiError } from "./client";
import { mockStore } from "./mocks/store";

export async function login({ email, password }) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 180));
    // Accept admin@store.local / admin123 or common test credentials
    if (
      (email === "admin@store.local" && password === "admin123") ||
      (email === "manager@store.local" && password === "manager123") ||
      (email === "staff@store.local" && password === "staff123") ||
      (email === "production@store.local" && password === "prod123")
    ) {
      let role = "admin";
      let name = "Ramesh Sharma (Admin)";
      if (email.startsWith("manager")) {
        role = "manager";
        name = "Kavita Nair (Manager)";
      } else if (email.startsWith("staff")) {
        role = "staff";
        name = "Varun Kumar (Counter Staff)";
      } else if (email.startsWith("production")) {
        role = "production";
        name = "Prakash Patil (Production)";
      }

      const user = { email, name, role };
      localStorage.setItem("stocksense_token", "mock-token-" + Date.now());
      localStorage.setItem("stocksense_user", JSON.stringify(user));
      mockStore.user = user;
      mockStore.save();
      return { token: "mock-token", user };
    }
    throw new ApiError("Wrong email or password", 401, "INVALID_CREDENTIALS");
  }

  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data?.token) {
    localStorage.setItem("stocksense_token", data.token);
    localStorage.setItem("stocksense_user", JSON.stringify(data.user));
  }
  return data;
}

export function getCurrentUser() {
  const userStr = localStorage.getItem("stocksense_user");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  // Default logged in user in mock mode for instant usability
  if (USE_MOCKS) {
    return mockStore.user;
  }
  return null;
}

export function logout() {
  localStorage.removeItem("stocksense_token");
  localStorage.removeItem("stocksense_user");
}
