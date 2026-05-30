const TOKEN_KEY = "sx_admin_token";
const USER_KEY = "sx_admin_user";

export function setSession(token: string, username: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, username);
}

export function getSession(): { token: string; username: string } | null {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const username = sessionStorage.getItem(USER_KEY);
  if (!token || !username) return null;
  return { token, username };
}

export function clearSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!sessionStorage.getItem(TOKEN_KEY);
}
