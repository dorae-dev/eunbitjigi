let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setAccessToken(t: string | null) {
  accessToken = t;
  if (typeof window !== "undefined") {
    if (t) localStorage.setItem("access_token", t);
    else localStorage.removeItem("access_token");
  }
}
export function getAccessToken() {
  return (
    accessToken ??
    (typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null)
  );
}

export function setRefreshToken(t: string | null) {
  refreshToken = t;
  if (typeof window !== "undefined") {
    if (t) localStorage.setItem("refresh_token", t);
    else localStorage.removeItem("refresh_token");
  }
}
export function getRefreshToken() {
  return (
    refreshToken ??
    (typeof window !== "undefined"
      ? localStorage.getItem("refresh_token")
      : null)
  );
}

export function clearTokens() {
  setAccessToken(null);
  setRefreshToken(null);
}
