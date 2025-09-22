import { api } from "./api";
import { setAccessToken, setRefreshToken, clearTokens } from "./token-store";
import qs from "qs";

export async function login(username: string, password: string) {
  const { data } = await api.post(
    "/login",
    qs.stringify({
      username,
      password,
      grant_type: "password",
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  setAccessToken(data.access_token);
  setRefreshToken(data.refresh_token);
  return data;
}

export async function logout() {
  // logout 엔드포인트 생기면 추가할 것
  //   try {
  //     await api.post("/logout");
  //   } catch {}
  clearTokens();
}

export async function me() {
  const { data } = await api.get("/me");
  return data;
}
