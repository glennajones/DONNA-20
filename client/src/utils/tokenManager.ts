// Token management utility
export function refreshAuthToken() {
  // Clear existing auth
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  
  // Force re-login by redirecting to login page
  window.location.href = "/login";
}

export function getStoredToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000; // Convert to milliseconds
    return Date.now() > expiry;
  } catch {
    return true; // Consider invalid tokens as expired
  }
}

export function shouldRefreshToken(): boolean {
  const token = getStoredToken();
  if (!token) return true;
  return isTokenExpired(token);
}