// export function minimize(): void {
//   window.electron.minimize()
// }

// export function toggleMaximize(): void {
//   window.electron.toggleMaximize()
// }

// export function close(): void {
//   window.electron.close()
// }

// export async function invoke(
//   channelOrObject: string | { channel: string; payload?: any },
//   data?: any,
// ): Promise<any> {
//   if (typeof channelOrObject === "string") {
//     return window.electron.invoke(channelOrObject, data)
//   } else {
//     return window.electron.invoke(channelOrObject.channel, channelOrObject.payload)
//   }
// }

// // Legacy function for backward compatibility with existing code
// export function send(channel: string, data?: any): void {
//   window.electron.invoke(channel, data)
// }
export function minimize() {
  window.electron.ipcRenderer.send("window-minimize")
}

export function toggleMaximize() {
  window.electron.ipcRenderer.send("window-toggle-maximize")
}

export function close() {
  window.electron.ipcRenderer.send("window-close")
}

export async function invoke({ channel, payload }: { channel: string; payload?: any }): Promise<any> {
  return window.electron.ipcRenderer.invoke(channel, payload)
}
