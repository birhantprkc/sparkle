import os from "os"
import { ipcMain } from "electron"
import si from "systeminformation"
import { exec } from "child_process"
import fs from "fs"
import path from "path"
import log from "electron-log"
import { shell } from "electron"
import { executePowerShell } from "./powershell"
console.log = log.log
console.error = log.error
console.warn = log.warn
async function getSystemInfo() {
  try {
    const [cpuData, graphicsData, osInfo, memLayout, diskLayout, fsSize, blockDevices] =
      await Promise.all([
        si.cpu(),
        si.graphics(),
        si.osInfo(),
        si.memLayout(),
        si.diskLayout(),
        si.fsSize(),
        si.blockDevices(),
      ])

    let totalMemory = os.totalmem()
    const memoryType = memLayout.length > 0 ? memLayout[0].type : "Unknown"
    const cDrive = fsSize.find((d) => d.mount.toUpperCase().startsWith("C:"))

    let primaryDisk = null
    if (cDrive) {
      const cBlock = blockDevices.find((b) => b.mount && b.mount.toUpperCase().startsWith("C:"))

      if (cBlock) {
        primaryDisk =
          diskLayout.find(
            (disk) =>
              disk.device?.toLowerCase() === cBlock.device?.toLowerCase() ||
              disk.name?.toLowerCase().includes(cBlock.name?.toLowerCase()),
          ) || null
      }
    }

    let gpuInfo = { model: "GPU not found", vram: "N/A", hasGPU: false, isNvidia: false }

    if (graphicsData.controllers && graphicsData.controllers.length > 0) {
      const dedicatedControllers = graphicsData.controllers.filter((controller) => {
        const model = (controller.model || "").toLowerCase()
        return (
          (model.includes("nvidia") &&
            (model.includes("gtx") ||
              model.includes("rtx") ||
              model.includes("titan") ||
              model.includes("quadro") ||
              model.includes("mx") ||
              model.includes("tesla") ||
              model.includes("a100") ||
              model.includes("a40"))) ||
          (model.includes("amd") &&
            (model.includes("radeon") ||
              model.includes("rx") ||
              model.includes("vega") ||
              model.includes("firepro") ||
              model.includes("instinct")) &&
            !model.includes("graphics") &&
            !model.includes("integrated")) ||
          (model.includes("intel") && model.includes("arc"))
        )
      })
      const dedicatedGPU = dedicatedControllers.sort((a, b) => (b.vram || 0) - (a.vram || 0))[0]

      if (dedicatedGPU) {
        const hasGPU = true
        const isNvidia = dedicatedGPU.model.toLowerCase().includes("nvidia")
        gpuInfo = {
          model: dedicatedGPU.model || "Unknown GPU",
          vram: dedicatedGPU.vram ? `${Math.round(dedicatedGPU.vram / 1024)} GB` : "Unknown",
          hasGPU,
          isNvidia,
        }
      }
    }

    const versionScript = `(Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion").DisplayVersion`
    const versionPsResult = await executePowerShell(null, {
      script: versionScript,
      name: "GetWindowsVersion",
    })
    const windowsVersion = versionPsResult.success ? versionPsResult.output.trim() : "Unknown"

    return {
      cpu_model: cpuData.brand,
      cpu_cores: cpuData.physicalCores,
      cpu_threads: cpuData.threads,

      gpu_model: gpuInfo.model,
      vram: gpuInfo.vram,
      hasGPU: gpuInfo.hasGPU,
      isNvidia: gpuInfo.isNvidia,

      memory_total: totalMemory,
      memory_type: memoryType,

      os: osInfo.distro || "Windows",
      os_version: windowsVersion || "Unknown",

      disk_model: primaryDisk?.name || primaryDisk?.device || "Unknown Storage",
      disk_size: cDrive?.size
        ? `${Math.round(cDrive.size / 1024 / 1024 / 1024).toFixed(1)} GB`
        : "Unknown",
    }
  } catch (error) {
    console.error("Failed to get system info:", error)
    throw error
  }
}

function restartSystem() {
  try {
    exec("shutdown /r /t 0")
    return { success: true }
  } catch (error) {
    console.error("Failed to restart system:", error)
    throw error
  }
}

function restartExplorer() {
  try {
    exec("taskkill /f /im explorer.exe & start explorer.exe")
    return { success: true }
  } catch (error) {
    console.error("Failed to restart explorer:", error)
    return { success: false, error: error.message }
  }
}

function getUserName() {
  return os.userInfo().username
}
function clearSparkleCache() {
  try {
    const appDataPath = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming")
    const scriptsPath = path.join(appDataPath, "sparkle", "scripts")
    const logsPath = path.join(appDataPath, "sparkle", "logs")

    let scriptsCleared = false
    let logsCleared = false
    let errors = []

    if (fs.existsSync(scriptsPath)) {
      const files = fs.readdirSync(scriptsPath)
      for (const file of files) {
        const filePath = path.join(scriptsPath, file)
        try {
          if (fs.lstatSync(filePath).isFile()) {
            fs.unlinkSync(filePath)
          }
        } catch (err) {
          errors.push(`Failed to delete script file: ${file} - ${err.message}`)
        }
      }

      scriptsCleared = true
      console.log("Sparkle scripts directory files cleared successfully.")
    } else {
      console.warn("Sparkle scripts directory does not exist.")
      errors.push("Scripts directory does not exist.")
    }

    if (fs.existsSync(logsPath)) {
      const logFiles = fs.readdirSync(logsPath)
      for (const file of logFiles) {
        const filePath = path.join(logsPath, file)
        try {
          if (fs.lstatSync(filePath).isFile()) {
            fs.unlinkSync(filePath)
          }
        } catch (err) {
          errors.push(`Failed to delete log file: ${file} - ${err.message}`)
        }
      }
      logsCleared = true
      console.log("Sparkle logs directory files cleared successfully.")
    } else {
      console.warn("Sparkle logs directory does not exist.")
      errors.push("Logs directory does not exist.")
    }

    if (errors.length === 0) {
      return { success: true }
    } else {
      return {
        success: scriptsCleared || logsCleared,
        error: errors.join(" | "),
      }
    }
  } catch (error) {
    console.error("Failed to clear Sparkle scripts or logs directory:", error)
    return { success: false, error: error.message }
  }
}

function openLogFolder() {
  const logPath = path.join(
    process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
    "sparkle",
    "logs",
  )
  if (fs.existsSync(logPath)) {
    shell.openPath(logPath)
  } else {
    console.warn("Sparkle logs directory does not exist.")
    return { success: false, error: "Logs directory does not exist." }
  }
}

const ensureWingetScript = `
$TestMode = $false  # Set $true to force winget install for testing

function Check-Winget {
    try {
        $null = winget --version 2>&1
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Show-InstallerGUI {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    $form = New-Object System.Windows.Forms.Form
    $form.Text = "Sparkle: Winget Installer"
    $form.Size = New-Object System.Drawing.Size(600,400)
    $form.StartPosition = "CenterScreen"

    $label = New-Object System.Windows.Forms.Label
    $label.Text = "Welcome! Sparkle needs Winget to install apps."
    $label.AutoSize = $true
    $label.Location = New-Object System.Drawing.Point(20,20)
    $form.Controls.Add($label)

    $outputBox = New-Object System.Windows.Forms.TextBox
    $outputBox.Multiline = $true
    $outputBox.ScrollBars = 'Vertical'
    $outputBox.ReadOnly = $true
    $outputBox.Size = New-Object System.Drawing.Size(550,250)
    $outputBox.Location = New-Object System.Drawing.Point(20,60)
    $form.Controls.Add($outputBox)

    $closeButton = New-Object System.Windows.Forms.Button
    $closeButton.Text = "Close"
    $closeButton.Size = New-Object System.Drawing.Size(100,30)
    $closeButton.Location = New-Object System.Drawing.Point(240,320)
    $closeButton.Enabled = $false
    $closeButton.Add_Click({ $form.Close() })
    $form.Controls.Add($closeButton)

    function Append-Output {
        param($text)
        $outputBox.AppendText("$text\`r\`n")
        $outputBox.SelectionStart = $outputBox.Text.Length
        $outputBox.ScrollToCaret()
        [System.Windows.Forms.Application]::DoEvents()
    }

    # Create a runspace for background work
    $runspace = [runspacefactory]::CreateRunspace()
    $runspace.ApartmentState = "STA"
    $runspace.ThreadOptions = "ReuseThread"
    $runspace.Open()
    $runspace.SessionStateProxy.SetVariable("TestMode", $TestMode)

    $powershell = [powershell]::Create()
    $powershell.Runspace = $runspace

    [void]$powershell.AddScript({
        function Check-Winget {
            try {
                $null = winget --version 2>&1
                return $LASTEXITCODE -eq 0
            } catch {
                return $false
            }
        }

        $result = @{
            Success = $false
            Messages = @()
        }

        try {
            $result.Messages += "Checking for Winget..."
            $wingetInstalled = Check-Winget

            if ($TestMode -or -not $wingetInstalled) {
                $result.Messages += "Winget not found. Installing for Sparkle..."
                
                try {
                    $result.Messages += "Attempting to register App Installer..."
                    
                    # Add timeout wrapper for AppX operations
                    $job = Start-Job -ScriptBlock {
                        Add-AppxPackage -RegisterByFamilyName -MainPackage Microsoft.DesktopAppInstaller_8wekyb3d8bbwe
                    }
                    
                    $completed = Wait-Job -Job $job -Timeout 60
                    if ($completed) {
                        Receive-Job -Job $job
                        Remove-Job -Job $job
                    } else {
                        Remove-Job -Job $job -Force
                        throw "Registration timed out after 60 seconds"
                    }
                    
                    Start-Sleep -Seconds 2
                    
                    if (Check-Winget) {
                        $result.Messages += "Winget installed successfully!"
                        $result.Success = $true
                    } else {
                        throw "Registration completed but winget not found"
                    }
                } catch {
                    $result.Messages += "Registration method failed: $($_.Exception.Message)"
                    $result.Messages += "Trying download method..."
                    
                    try {
                        $result.Messages += "Downloading latest App Installer package..."
                        $progressPreference = 'SilentlyContinue'
                        
                        # Add timeout to web requests
                        $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/microsoft/winget-cli/releases/latest" -TimeoutSec 30
                        $downloadUrl = ($releases.assets | Where-Object { $_.name -like "*.msixbundle" }).browser_download_url
                        
                        if (-not $downloadUrl) {
                            throw "Could not find download URL in GitHub release"
                        }
                        
                        $tempFile = Join-Path $env:TEMP "Microsoft.DesktopAppInstaller.msixbundle"
                        
                        $result.Messages += "Downloading from GitHub..."
                        Invoke-WebRequest -Uri $downloadUrl -OutFile $tempFile -TimeoutSec 120
                        
                        $result.Messages += "Installing package (this may take a minute)..."
                        
                        # Add timeout wrapper for installation
                        $job = Start-Job -ScriptBlock {
                            param($path)
                            Add-AppxPackage -Path $path
                        } -ArgumentList $tempFile
                        
                        $completed = Wait-Job -Job $job -Timeout 120
                        if ($completed) {
                            Receive-Job -Job $job
                            Remove-Job -Job $job
                        } else {
                            Remove-Job -Job $job -Force
                            throw "Installation timed out after 120 seconds"
                        }
                        
                        # Clean up
                        if (Test-Path $tempFile) {
                            Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
                        }
                        
                        Start-Sleep -Seconds 2
                        
                        if (Check-Winget) {
                            $result.Messages += "Winget installed successfully!"
                            $result.Success = $true
                        } else {
                            $result.Messages += "WARNING: Installation completed but winget command not available yet."
                            $result.Messages += "You may need to restart your terminal or computer."
                            $result.Success = $false
                        }
                    } catch {
                        $result.Messages += "ERROR: Failed to install Winget."
                        $result.Messages += $_.Exception.Message
                        $result.Messages += ""
                        $result.Messages += "Manual installation: Visit https://aka.ms/getwinget"
                        $result.Success = $false
                    }
                }
            } else {
                $result.Messages += "Winget is already installed. Sparkle is ready to install apps!"
                $result.Success = $true
            }
        } catch {
            $result.Messages += "ERROR: Unexpected error occurred."
            $result.Messages += $_.Exception.Message
            $result.Success = $false
        }

        return $result
    })

    $handle = $powershell.BeginInvoke()

    # Poll for completion
    $timer = New-Object System.Windows.Forms.Timer
    $timer.Interval = 500
    $timer.Add_Tick({
        if ($handle.IsCompleted) {
            $timer.Stop()
            
            try {
                $result = $powershell.EndInvoke($handle)
                
                foreach ($message in $result.Messages) {
                    Append-Output $message
                }
                
                Append-Output ""
                Append-Output "You can now close this window."
            } catch {
                Append-Output "ERROR: Installation process failed."
                Append-Output $_.Exception.Message
            } finally {
                $closeButton.Enabled = $true
                $powershell.Dispose()
                $runspace.Close()
            }
        }
    })

    $form.Add_Shown({ $timer.Start() })
    
    # Clean up on form close
    $form.Add_FormClosing({
        if (-not $handle.IsCompleted) {
            $powershell.Stop()
        }
        $timer.Stop()
        $powershell.Dispose()
        $runspace.Close()
    })

    [void]$form.ShowDialog()
}

# --- Main Execution ---
if ($TestMode -or -not (Check-Winget)) {
    Show-InstallerGUI
} else {
    Write-Output "Winget is already installed. Sparkle can install apps!"
}
`

export { ensureWingetScript }

function ensureWinget() {
  const result = executePowerShell(null, {
    script: ensureWingetScript,
    name: "Ensure-Winget",
  })
  return result
}

export { ensureWinget }
ipcMain.handle("restart", restartSystem)
ipcMain.handle("open-log-folder", openLogFolder)
ipcMain.handle("clear-sparkle-cache", clearSparkleCache)
ipcMain.handle("get-system-info", getSystemInfo)
ipcMain.handle("get-user-name", getUserName)
ipcMain.handle("restart-explorer", restartExplorer)
