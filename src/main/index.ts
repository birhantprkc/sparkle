import { app, shell, BrowserWindow, ipcMain } from "electron"
import path, { join } from "path"
import { electronApp, optimizer, is } from "@electron-toolkit/utils"
import log from "electron-log"
import "./system"
import "./powershell"
import "./rpc"
import "./tweakHandler"
import "./dnsHandler"
import "./backup"
import { executePowerShell } from "./powershell"
import { createTray } from "./tray"
import { setupTweaksHandlers } from "./tweakHandler"
import { setupDNSHandlers } from "./dnsHandler"
import Store from "electron-store"
import { startDiscordRPC, stopDiscordRPC } from "./rpc"
import { initAutoUpdater } from "./updates.js"

console.log = log.log
console.error = log.error
console.warn = log.warn

export const logo = "[Sparkle]:"
log.initialize()

async function Defender(): Promise<void> {
  const Apppath = path.dirname(process.execPath)
  if (app.isPackaged) {
    const result = await executePowerShell(null, {
      script: `
        if (Get-Command Add-MpPreference -ErrorAction SilentlyContinue) {
          Add-MpPreference -ExclusionPath '${Apppath}'
          Write-Output "Success"
        } else {
          Write-Output "Skipped"
        }
      `,
      name: "Add-MpPreference",
    })

    if (result.output && result.output.includes("Skipped")) {
      console.log(logo, "Skipped Windows Defender exclusion (Defender not found)")
    } else {
      console.log(logo, "Added Sparkle to Windows Defender Exclusions")
    }
  } else {
    console.log(logo, "Running in development mode, skipping Windows Defender exclusion")
  }
}

const store = new Store()

let trayInstance: any = null
if (store.get("showTray") === undefined) {
  store.set("showTray", true)
}

ipcMain.handle("tray:get", () => {
  return store.get("showTray")
})
ipcMain.handle("tray:set", (_event: Electron.IpcMainInvokeEvent, value: boolean) => {
  store.set("showTray", value)
  if (mainWindow) {
    if (value) {
      if (!trayInstance) {
        trayInstance = createTray(mainWindow)
      }
    } else {
      if (trayInstance) {
        trayInstance.destroy()
        trayInstance = null
      }
    }
  }
  return store.get("showTray")
})

const initDiscordRPC = (): void => {
  if (store.get("discord-rpc") === undefined) {
    store.set("discord-rpc", true)
    console.log("(main.js) ", logo, "Starting Discord RPC")
    startDiscordRPC().catch((err: Error) => {
      console.warn("(main.js) ", "Failed to initialize Discord RPC:", err.message)
    })
  } else if (store.get("discord-rpc") === true) {
    console.log("(main.js) ", logo, "Starting Discord RPC (from settings)")
    startDiscordRPC().catch((err: Error) => {
      console.warn("(main.js) ", "Failed to initialize Discord RPC:", err.message)
    })
  }
}

ipcMain.handle(
  "discord-rpc:toggle",
  async (_event: Electron.IpcMainInvokeEvent, value: boolean) => {
    try {
      if (value) {
        store.set("discord-rpc", true)
        console.log(logo, "Starting Discord RPC")
        startDiscordRPC().catch((err: Error) => {
          console.warn("(main.js) ", "Failed to start Discord RPC:", err.message)
        })
      } else {
        store.set("discord-rpc", false)
        console.log(logo, "Stopping Discord RPC")
        stopDiscordRPC().catch(() => {})
      }
      return { success: true, enabled: store.get("discord-rpc") }
    } catch (error: any) {
      console.error(logo, "Error toggling Discord RPC:", error)
      return {
        success: false,
        error: error.message,
        enabled: store.get("discord-rpc"),
      }
    }
  },
)
ipcMain.handle("discord-rpc:get", () => {
  return store.get("discord-rpc")
})

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

export let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  console.log("[Sparkle]: createWindow called")
  console.log("[Sparkle]: __dirname =", __dirname)
  console.log("[Sparkle]: icon path =", path.join(__dirname, "../../resources/sparkle2.ico"))
  console.log("[Sparkle]: preload path =", join(__dirname, "../preload/index.js"))
  console.log("[Sparkle]: renderer path =", join(__dirname, "../renderer/index.html"))

  try {
    mainWindow = new BrowserWindow({
      width: 1380,
      backgroundColor: "#0c121f",
      height: 760,
      // minWidth: 1380,
      // minHeight: 760,
      minWidth: 790,
      center: true,
      frame: false,
      show: false,
      autoHideMenuBar: true,
      icon: path.join(__dirname, "../../resources/sparkle2.ico"),
      webPreferences: {
        preload: join(__dirname, "../preload/index.js"),
        devTools: app.isPackaged ? false : true,
        sandbox: false,
      },
    })
    console.log("[Sparkle]: BrowserWindow created")
  } catch (err: any) {
    console.error("[Sparkle]: BrowserWindow creation failed:", err)
    throw err
  }

  mainWindow.webContents.setWindowOpenHandler((details: Electron.HandlerDetails) => {
    shell.openExternal(details.url)
    return { action: "deny" }
  })

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    console.log("[Sparkle]: Loading renderer from URL:", process.env["ELECTRON_RENDERER_URL"])
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"])
  } else {
    console.log("[Sparkle]: Loading renderer from file")
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"))
  }

  mainWindow.once("ready-to-show", () => {
    console.log("[Sparkle]: Window ready to show")
    mainWindow!.show()
  })

  mainWindow.webContents.on(
    "did-fail-load",
    (_event: Electron.Event, errorCode: number, errorDescription: string) => {
      console.error("[Sparkle]: Renderer failed to load:", errorCode, errorDescription)
    },
  )
}

app
  .whenReady()
  .then(() => {
    console.log("[Sparkle]: App ready, creating window...")
    try {
      createWindow()
      console.log("[Sparkle]: Window created successfully")
    } catch (err: any) {
      console.error("[Sparkle]: createWindow failed:", err)
    }
    initAutoUpdater(() => mainWindow)
    console.log("[Sparkle]: Auto updater initialized")
    if (store.get("showTray")) {
      console.log("[Sparkle]: Creating tray...")
      setTimeout(() => {
        try {
          trayInstance = createTray(mainWindow!)
          console.log("[Sparkle]: Tray created")
        } catch (err: any) {
          console.error("[Sparkle]: Tray creation failed:", err)
        }
      }, 50)
    }
    setTimeout(() => {
      void Defender()
      setupTweaksHandlers()
      setupDNSHandlers()
      console.log("[Sparkle]: Handlers setup complete")
    }, 0)

    electronApp.setAppUserModelId("com.parcoil.sparkle")

    app.on("browser-window-created", (_, window: BrowserWindow) => {
      optimizer.watchWindowShortcuts(window)
    })

    ipcMain.on("window-minimize", () => {
      if (mainWindow) mainWindow.minimize()
    })

    ipcMain.on("window-toggle-maximize", () => {
      if (mainWindow) {
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize()
        } else {
          mainWindow.maximize()
        }
      }
    })

    ipcMain.on("window-close", () => {
      if (mainWindow) {
        if (store.get("showTray")) {
          mainWindow.hide()
        } else {
          app.quit()
        }
      }
    })

    initDiscordRPC()

    app.on("activate", function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
  .catch((err: any) => {
    console.error("[Sparkle]: app.whenReady failed:", err)
  })
