const KEY = "sx_admin_token";

export function setAdminToken(token: string): void {
  sessionStorage.setItem(KEY, token);
}

export function getAdminToken(): string | null {
  return sessionStorage.getItem(KEY);
}

export function clearAdminToken(): void {
  sessionStorage.removeItem(KEY);
}

export function isAuthenticated(): boolean {
  return !!sessionStorage.getItem(KEY);
}
