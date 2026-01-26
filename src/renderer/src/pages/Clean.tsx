import Button from "@/components/ui/button"
import Toggle from "@/components/ui/Toggle"
import { useState } from "react"
import { invoke } from "@/lib/electron"
import RootDiv from "@/components/rootdiv"
import { RefreshCw, Icon } from "lucide-react"
import { broom } from "@lucide/lab"
import { toast } from "react-toastify"
import log from "electron-log/renderer"
import Card from "@/components/ui/Card"

const cleanups = [
  {
    id: "temp",
    label: "Clean Temporary Files",
    description: "Remove system and user temporary files.",
    script: `
      $systemTemp = "$env:SystemRoot\\Temp"
      $userTemp = [System.IO.Path]::GetTempPath()
      $foldersToClean = @($systemTemp, $userTemp)
      $totalSizeBefore = 0
      
      foreach ($folder in $foldersToClean) {
          if (Test-Path $folder) {
              $folderSize = (Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
              $totalSizeBefore += if ($folderSize) { $folderSize } else { 0 }
              Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
          }
      }
      
      Write-Output $totalSizeBefore
    `,
  },
  {
    id: "prefetch",
    label: "Clean Prefetch Files",
    description: "Delete files from the Windows Prefetch folder.",
    script: `
      $prefetch = "$env:SystemRoot\\Prefetch"
      $totalSizeBefore = 0
      if (Test-Path $prefetch) {
          $totalSizeBefore = (Get-ChildItem -Path "$prefetch\\*" -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
          Remove-Item "$prefetch\\*" -Force -Recurse -ErrorAction SilentlyContinue
      }
      Write-Output $totalSizeBefore
    `,
  },
  {
    id: "recyclebin",
    label: "Empty Recycle Bin (Dangerous)",
    description: "Permanently remove files from the Recycle Bin.",
    script: `
      $recycleBinSize = 0
      $shell = New-Object -ComObject Shell.Application
      $recycleBin = $shell.Namespace(0xA)
      $recycleBinSize = ($recycleBin.Items() | Measure-Object -Property Size -Sum).Sum
      Clear-RecycleBin -Force -ErrorAction SilentlyContinue
      Write-Output $recycleBinSize
    `,
  },
  {
    id: "windows-update",
    label: "Clean Windows Update Cache",
    description: "Remove Windows Update downloaded installation files.",
    script: `
      $windowsUpdateDownload = "$env:SystemRoot\\SoftwareDistribution\\Download"
      $totalSizeBefore = 0
      if (Test-Path $windowsUpdateDownload) {
          $totalSizeBefore = (Get-ChildItem -Path "$windowsUpdateDownload\\*" -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
          Remove-Item "$windowsUpdateDownload\\*" -Force -Recurse -ErrorAction SilentlyContinue
      }
      Write-Output $totalSizeBefore
    `,
  },
  {
    id: "thumbnails",
    label: "Clear Thumbnail Cache",
    description: "Remove cached thumbnail images used by File Explorer.",
    script: `
      $thumbCache = "$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer"
      $totalSizeBefore = 0
      $thumbFiles = Get-ChildItem "$thumbCache\\thumbcache_*.db" -ErrorAction SilentlyContinue
      if ($thumbFiles) {
          $totalSizeBefore = ($thumbFiles | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
          Remove-Item "$thumbCache\\thumbcache_*.db" -Force -ErrorAction SilentlyContinue
      }
      Write-Output $totalSizeBefore
    `,
  },
]

function Clean() {
  const [selected, setSelected] = useState<string[]>([])
  const [loadingQueue, setLoadingQueue] = useState<string[]>([])
  const [lastClean, setLastClean] = useState(
    localStorage.getItem("last-clean") || "Not cleaned yet.",
  )
  const [isCleaning, setIsCleaning] = useState(false)
  const [cleanupResults, setCleanupResults] = useState({})

  const toggleCleanup = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const formatBytes = (bytes) => {
    if (bytes === 0 || !bytes) return "0 B"
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }

  async function runSelectedCleanups() {
    setIsCleaning(true)
    setLoadingQueue([])
    setCleanupResults({})
    let anySuccess = false
    let newResults = {}

    for (const cleanup of cleanups) {
      if (!selected.includes(cleanup.id)) continue
      setLoadingQueue((q) => [...q, cleanup.id])
      const toastId = toast.loading(`Running ${cleanup.label}...`)
      try {
        const result = await invoke({
          channel: "run-powershell",
          payload: { script: cleanup.script, name: `cleanup-${cleanup.id}` },
        })

        const resultStr = result?.output || "0"
        const freedSpace = parseInt(resultStr.trim(), 10) || 0
        newResults[cleanup.id] = freedSpace

        toast.update(toastId, {
          render: `${cleanup.label} completed! ${formatBytes(freedSpace)} cleared.`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        })
        anySuccess = true
      } catch (err: any) {
        toast.update(toastId, {
          render: `Failed: ${err.message || err}`,
          type: "error",
          isLoading: false,
          autoClose: 4000,
        })
        log.error(`Failed to run ${cleanup.id} cleanup: ${err.message || err}`)
      }
    }

    if (anySuccess) {
      const now = new Date().toLocaleString()
      setLastClean(now)
      localStorage.setItem("last-clean", now)
      setCleanupResults(newResults)
    }

    setLoadingQueue([])
    setIsCleaning(false)
  }

  return (
    <RootDiv>
      <div className="flex flex-col gap-6">
        <Card className="flex items-center gap-4 p-4">
          <div className="flex items-center justify-center p-3 rounded-xl bg-teal-500/10">
            <Icon iconNode={broom} className="text-teal-500" size={28} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-sparkle-text mb-1">System Cleanup</h2>
            <p className="text-sm text-sparkle-text-secondary">
              Last cleaned: <span className="font-medium">{lastClean}</span>
            </p>
          </div>
        </Card>

        <Card className="flex flex-col divide-y divide-sparkle-border p-0">
          {cleanups.map(({ id, label, description }, idx) => {
            const isSelected = selected.includes(id)
            return (
              <div
                key={id}
                className={`relative flex items-center justify-between px-6 py-4 ${idx === 0 ? "rounded-t-xl" : ""} ${idx === cleanups.length - 1 ? "rounded-b-xl" : ""} group`}
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-base font-semibold text-sparkle-text truncate">
                    {label}
                  </span>
                  <span className="text-xs text-sparkle-text-secondary mt-0.5 truncate">
                    {description}
                    {cleanupResults[id] ? ` (${formatBytes(cleanupResults[id])} cleared)` : ""}
                  </span>
                </div>
                <div className="ml-4 flex items-center">
                  <Toggle
                    checked={isSelected}
                    onChange={() => toggleCleanup(id)}
                    disabled={isCleaning}
                  />
                </div>
                {loadingQueue.includes(id) && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 rounded-xl">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sparkle-border border border-sparkle-border-secondary">
                      <RefreshCw className="animate-spin text-teal-500" size={18} />
                      <span className="text-sm font-medium text-teal-600">Cleaning...</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </Card>

        <div className="flex justify-end mt-2">
          <Button
            onClick={runSelectedCleanups}
            disabled={isCleaning || selected.length === 0}
            size="md"
            variant="primary"
            className="min-w-[180px] flex items-center justify-center gap-2 text-base font-semibold"
          >
            {isCleaning ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                <span>Cleaning...</span>
              </>
            ) : (
              <>
                <Icon iconNode={broom} size={18} />
                <span>Clean Selected</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </RootDiv>
  )
}

export default Clean
