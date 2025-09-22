import { api } from "./api";
import { setTokens, clearTokens } from "./token-store";
import qs from "qs";

export async function login(
  username: string,
  password: string,
  rememberMe: boolean
) {
  const { data } = await api.post(
    "/login",
    qs.stringify({
      username,
      password,
      grant_type: "password",
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  setTokens(
    { access: data.access_token, refresh: data.refresh_token },
    { remember: rememberMe }
  );
  return data;
}

export async function adminLogin(
  username: string,
  password: string,
  rememberMe: boolean
) {
  const { data } = await api.post(
    "/admin/login",
    qs.stringify({
      username,
      password,
      grant_type: "password",
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  setTokens(
    { access: data.access_token, refresh: data.refresh_token },
    { remember: rememberMe }
  );
  return data;
}

export async function logout() {
  clearTokens();
}

export async function me() {
  const { data } = await api.get("/me");
  return data;
}
