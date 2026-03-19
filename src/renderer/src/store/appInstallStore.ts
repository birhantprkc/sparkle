import { create } from "zustand"

interface InstallingApp {
  id: string
  name: string
  status: "pending" | "installing" | "complete" | "error"
}

interface AppInstallState {
  apps: InstallingApp[]
  addApp: (id: string, name: string) => void
  setAppStatus: (id: string, status: InstallingApp["status"]) => void
  removeApp: (id: string) => void
  clearApps: () => void
}

const useAppInstallStore = create<AppInstallState>((set) => ({
  apps: [],
  addApp: (id, name) =>
    set((state) => ({
      apps: [...state.apps, { id, name, status: "installing" }],
    })),
  setAppStatus: (id, status) =>
    set((state) => ({
      apps: state.apps.map((app) => (app.id === id ? { ...app, status } : app)),
    })),
  removeApp: (id) =>
    set((state) => ({
      apps: state.apps.filter((app) => app.id !== id),
    })),
  clearApps: () => set({ apps: [] }),
}))

export default useAppInstallStore
