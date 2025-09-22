"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  getAccessToken,
  getRefreshToken,
  isExpired,
  setTokens,
  clearTokens,
} from "@/lib/token-store";

const PUBLIC_PAGES = ["/", "/login", "/signup"];

export default function AuthBootstrap({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const redirectedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const at = getAccessToken();
        const rt = getRefreshToken();

        // 로그인 안 된 상태
        if (!rt) {
          setReady(true);
          return;
        }

        // 액세스가 없거나 만료 → 리프레시
        if (!at || isExpired(at)) {
          const { data } = await api.post("/refresh", {
            refresh_token: rt,
          });
          // refresh 토큰 회전이 없다면 기존 rt 유지, 있다면 data.refresh_token으로 교체
          setTokens({ access: data.access_token, refresh: rt });
        }

        // 여기 오면 인증 OK
        if (PUBLIC_PAGES.includes(pathname) && !redirectedRef.current) {
          redirectedRef.current = true;
          router.replace("/dashboard");
        }
      } catch {
        // 리프레시 실패 → 완전 로그아웃 상태
        clearTokens();
      } finally {
        setReady(true);
      }
    })();
  }, [pathname, router]);

  // 초기 부팅 동안 깜빡임 방지 (필요시 스피너로 대체)
  if (!ready) return null;

  return <>{children}</>;
}
