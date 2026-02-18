import { ipcMain } from "electron"
import { Client, PresenceBuilder, ActivityType } from "discord-rpc-new"
import { logo } from "./index"
import jsonData from "../../package.json"
import log from "electron-log"

console.log = log.log
console.error = log.error
console.warn = log.warn

const clientId = "1188686354490609754"
let rpcClient: Client | null = null
let isInitializing = false
let initRetryCount = 0
const MAX_RETRIES = 3

async function startDiscordRPC(): Promise<boolean> {
  if (isInitializing || rpcClient) {
    return false
  }

  if (initRetryCount >= MAX_RETRIES) {
    console.warn("(rpc.js) ", "Max Discord RPC retries reached, giving up")
    return false
  }

  isInitializing = true
  initRetryCount++

  setTimeout(async () => {
    try {
      rpcClient = new Client()

      rpcClient.on("READY", () => {
        console.log("(rpc.js) ", logo, "Discord RPC connected")
        isInitializing = false
        initRetryCount = 0

        const activity = new PresenceBuilder()
          .setType(ActivityType.Playing)
          .setDetails("Optimizing your PC")
          .setState(`Running Sparkle v${jsonData.version ?? "2"}`)
          .setLargeImage("sparklelogo", "Sparkle Optimizer")
          .addButton("Download Sparkle", "https://parcoil.com/sparkle")
          .addButton("Join Discord", "https://discord.com/invite/En5YJYWj3Z")
          .build()

        const client = rpcClient
        if (!client || !activity) return

        console.log("(rpc.js) ", "Setting activity:", JSON.stringify(activity, null, 2))

        try {
          client.setActivity(activity)
          console.log("(rpc.js) ", "Activity set successfully")
        } catch (err: any) {
          console.warn("(rpc.js) ", "Failed to set Discord RPC activity:", err.message)
        }
      })

      rpcClient.on("disconnected", () => {
        console.log("(rpc.js) ", "Discord RPC connected event fired")
      })

      rpcClient.on("close", () => {
        console.log("(rpc.js) ", "Discord RPC connection closed")
      })

      rpcClient.on("ERROR", (error: Error) => {
        console.warn("(rpc.js) ", "Discord RPC error:", error.message)
        isInitializing = false
        stopDiscordRPC().catch(() => {})
      })

      await rpcClient.login({ clientId }).catch((error: Error) => {
        console.warn("(rpc.js) ", "Discord RPC login failed:", error.message)
        isInitializing = false
        stopDiscordRPC().catch(() => {})
      })

      console.log("(rpc.js) ", "Discord RPC login completed")
    } catch (error: any) {
      console.warn("(rpc.js) ", "Failed to initialize Discord RPC:", error.message)
      isInitializing = false
      stopDiscordRPC().catch(() => {})
    }
  }, 1000)

  return true
}

async function stopDiscordRPC(): Promise<boolean> {
  if (!rpcClient) {
    return true
  }

  const client = rpcClient
  rpcClient = null
  isInitializing = false

  try {
    await client.destroy()
  } catch (error: any) {
    console.warn("(rpc.js) ", "Error stopping Discord RPC:", error.message)
  }

  console.log("(rpc.js) ", "Discord RPC disconnected")
  return true
}

ipcMain.handle("start-discord-rpc", () => {
  return startDiscordRPC()
})

ipcMain.handle("stop-discord-rpc", () => {
  return stopDiscordRPC()
})

export { startDiscordRPC, stopDiscordRPC }
