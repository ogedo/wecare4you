import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });
        const newToken = data.data.accessToken;
        await SecureStore.setItemAsync("accessToken", newToken);
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api(error.config);
      } catch {
        await SecureStore.deleteItemAsync("accessToken");
      }
    }
    return Promise.reject(error);
  }
);
