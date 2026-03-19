import { create } from "zustand"

interface InstallingApp {
  id: string
  name: string
  status: "pending" | "installing" | "complete" | "error"
}

interface AppInstallState {
  apps: InstallingApp[]
  action: "install" | "uninstall" | null
  addApp: (id: string, name: string) => void
  setAppStatus: (id: string, status: InstallingApp["status"]) => void
  removeApp: (id: string) => void
  clearApps: () => void
  setAction: (action: "install" | "uninstall" | null) => void
}

const useAppInstallStore = create<AppInstallState>((set) => ({
  apps: [],
  action: null,
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
  clearApps: () => set({ apps: [], action: null }),
  setAction: (action) => set({ action }),
}))

export default useAppInstallStore
