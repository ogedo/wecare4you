import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  user: { id: string; phone: string; email?: string; role: string; adminTier?: string } | null;
  setAuth: (token: string, user: AuthState["user"]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      logout: () => {
        set({ accessToken: null, user: null });
        localStorage.removeItem("accessToken");
        if (typeof document !== "undefined") {
          document.cookie = "wc4y_session=; path=/; max-age=0";
        }
      },
    }),
    { name: "wecare4you-auth" }
  )
);
