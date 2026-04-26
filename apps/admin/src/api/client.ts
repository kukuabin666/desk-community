/**
 * 与 Web 端同一鉴权：Bearer + X-Device-Id；localStorage 键与 `desk_at` / `desk_rt` 一致，便于同域部署时共享登录态。
 */
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE || '/api';

export const api = axios.create({
  baseURL,
  timeout: 30000,
});

export function setAuthHeader(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

let cachedDeviceId: string | null = null;

export function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;
  const k = 'desk_device_id';
  let v = localStorage.getItem(k);
  if (!v) {
    v = `web_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem(k, v);
  }
  cachedDeviceId = v;
  return v;
}

api.interceptors.request.use(cfg => {
  cfg.headers['X-Device-Id'] = getDeviceId();
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.message || err.message || '请求失败';
    return Promise.reject(new Error(msg));
  }
);

export type ApiResp<T> = { success: boolean; code: number; message?: string; data?: T };
