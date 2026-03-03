import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface User {
  id: string;
  phone: string;
  email?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  hydrated: boolean;
  setAuth: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  hydrated: false,

  hydrate: async () => {
    const token = await SecureStore.getItemAsync("accessToken");
    const userJson = await SecureStore.getItemAsync("user");
    const user = userJson ? (JSON.parse(userJson) as User) : null;
    set({ accessToken: token, user, hydrated: true });
  },

  setAuth: async (token, user) => {
    await SecureStore.setItemAsync("accessToken", token);
    await SecureStore.setItemAsync("user", JSON.stringify(user));
    set({ accessToken: token, user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("user");
    set({ accessToken: null, user: null });
  },
}));
