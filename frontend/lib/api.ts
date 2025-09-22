import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  clearTokens,
} from "./token-store";

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

// 공용 인스턴스 (여기에 인터셉터 부착)
export const api = axios.create({
  baseURL,
  // withCredentials: false // JSON 토큰 방식이라면 기본 false. (쿠키 전략으로 바꾸면 true)
});

// refresh 전용 인스턴스 (인터셉터 없음; 재귀 방지)
const refreshApi = axios.create({ baseURL });

// 요청 인터셉터: 액세스 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const at = getAccessToken();
  if (at) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${at}`;
  }
  return config;
});

let refreshing = false;
let pendingQueue: Array<() => void> = [];

// 응답 인터셉터: 401 → refresh → 원요청 재시도
api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = (err.config || {}) as RetryConfig;
    const status = err.response?.status;

    if (status !== 401 || original._retry) {
      // 그 외 에러는 그대로 던짐
      throw err;
    }

    // 동시에 여러 401이 터지는 상황 방지
    if (refreshing) {
      await new Promise<void>((resolve) => pendingQueue.push(resolve));
      original.headers = original.headers ?? {};
      const at = getAccessToken();
      if (at) original.headers.Authorization = `Bearer ${at}`;
      original._retry = true;
      return api(original);
    }

    try {
      refreshing = true;
      // 1) refresh 요청 (JSON 토큰 방식)
      const rt = getRefreshToken();
      const r = await refreshApi.post("/refresh", { refresh_token: rt });
      const newAccess = (r.data as any).access_token;
      setAccessToken(newAccess);

      // 2) 대기 중이던 요청들 풀어주기
      pendingQueue.forEach((fn) => fn());
      pendingQueue = [];

      // 3) 실패했던 원요청 재시도
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newAccess}`;
      original._retry = true;
      return api(original);
    } catch (e) {
      // refresh 실패 → 토큰 비우고 에러 전파(상위에서 로그인 화면으로 이동 등)
      clearTokens();
      pendingQueue = [];
      throw e;
    } finally {
      refreshing = false;
    }
  }
);
