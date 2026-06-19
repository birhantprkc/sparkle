import { create } from "zustand"

interface OnlineState {
  online: boolean
  setOnline: (online: boolean) => void
  checkOnline: () => Promise<void>
}

const useOnlineStore = create<OnlineState>((set) => ({
  online: true,
  setOnline: (online: boolean) => set({ online }),
  checkOnline: async () => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      await fetch("https://jsonplaceholder.typicode.com/todos/1", {
        method: "GET",
        signal: controller.signal,
      })
      clearTimeout(timeout)
      set({ online: true })
    } catch {
      set({ online: false })
    }
  },
}))

export default useOnlineStore
