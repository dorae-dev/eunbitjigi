type Persist = "local" | "session";
const stores = {
  local: typeof window !== "undefined" ? window.localStorage : undefined,
  session: typeof window !== "undefined" ? window.sessionStorage : undefined,
};

// 간단한 JWT exp 파서 (외부 라이브러리 없이)
function decodeExp(token?: string | null): number | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

export function isExpired(token?: string | null, skewSec = 15) {
  const exp = decodeExp(token);
  if (!exp) return false; // exp 없으면 만료 판단 불가 → 일단 사용
  const now = Math.floor(Date.now() / 1000);
  return exp - skewSec <= now; // 15초 여유 두고 만료로 간주
}

let accessMem: string | null = null;
let refreshMem: string | null = null;

function getStore(remember: boolean): Persist {
  return remember ? "local" : "session";
}

export function setTokens(
  { access, refresh }: { access: string | null; refresh: string | null },
  opts?: { remember?: boolean }
) {
  const persist = getStore(opts?.remember ?? true);
  const s = stores[persist];

  accessMem = access ?? null;
  refreshMem = refresh ?? null;

  if (s) {
    if (access) s.setItem("access_token", access);
    else s.removeItem("access_token");

    if (refresh) s.setItem("refresh_token", refresh);
    else s.removeItem("refresh_token");
  }
  // 반대 스토리지에 남아있을 잔재 제거
  const other = persist === "local" ? stores.session : stores.local;
  other?.removeItem("access_token");
  other?.removeItem("refresh_token");
}

export function getAccessToken() {
  if (accessMem) return accessMem;
  return (
    stores.local?.getItem("access_token") ||
    stores.session?.getItem("access_token") ||
    null
  );
}

export function getRefreshToken() {
  if (refreshMem) return refreshMem;
  return (
    stores.local?.getItem("refresh_token") ||
    stores.session?.getItem("refresh_token") ||
    null
  );
}

export function clearTokens() {
  accessMem = null;
  refreshMem = null;
  stores.local?.removeItem("access_token");
  stores.local?.removeItem("refresh_token");
  stores.session?.removeItem("access_token");
  stores.session?.removeItem("refresh_token");
}
