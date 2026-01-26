import { useState, useEffect } from "react"
import RootDiv from "@/components/rootdiv"
import { Cpu, HardDrive, Zap, MemoryStick, Gpu } from "lucide-react"
import InfoCard from "@/components/infocard"
import { invoke } from "@/lib/electron"
import Button from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import useSystemStore from "@/store/systemInfo"
import log from "electron-log/renderer"
import Greeting from "@/components/greeting"
import { MonitorCog } from "lucide-react"
import { Wrench } from "lucide-react"
import Card from "@/components/ui/Card"
import { Download } from "lucide-react"
import { X } from "lucide-react"
import { toast } from "react-toastify"
function Home() {
  const systemInfo = useSystemStore((state) => state.systemInfo)
  const setSystemInfo = useSystemStore((state) => state.setSystemInfo)
  const [tweakInfo, setTweakInfo] = useState(() => {
    try {
      const cached = localStorage.getItem("sparkle:tweakInfo")
      return cached ? JSON.parse(cached) : null
    } catch (err) {
      console.error("Failed to parse tweakInfo cache", err)
      return null
    }
  })
  const router = useNavigate()
  const [loading, setLoading] = useState(true)
  const [usingCache, setUsingCache] = useState(false)
  const [activeTweaks, setActiveTweaks] = useState(() => {
    try {
      const cached = localStorage.getItem("sparkle:activeTweaks")
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  const [wingetInstalled, setWingetInstalled] = useState(true)
  const [wingetChecking, setWingetChecking] = useState(false)
  const [wingetInstalling, setWingetInstalling] = useState(false)
  const [wingetWarningDismissed, setWingetWarningDismissed] = useState(() => {
    try {
      return localStorage.getItem("sparkle:winget-warning-dismissed") === "true"
    } catch {
      return false
    }
  })

  const goToTweaks = () => {
    router("tweaks")
  }

  const fetchActiveTweaks = async () => {
    try {
      const active = await invoke({ channel: "tweak:active" })
      setActiveTweaks(active)
      localStorage.setItem("sparkle:activeTweaks", JSON.stringify(active))
    } catch (err) {
      console.error("Failed to fetch active tweaks:", err)
    }
  }

  useEffect(() => {
    const idleHandle = requestIdleCallback(() => {
      const cached = localStorage.getItem("sparkle:systemInfo")
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          setSystemInfo(parsed)
          setUsingCache(true)
          setLoading(false)
        } catch (err) {
          console.warn("Failed to parse systemInfo cache", err)
        }
      }

      invoke({ channel: "get-system-info" })
        .then((info) => {
          setSystemInfo(info)
          localStorage.setItem("sparkle:systemInfo", JSON.stringify(info))
          setUsingCache(false)
          log.info("Fetched system info")
        })
        .catch((err) => {
          log.error("Error fetching system info:", err)
          console.error("Error fetching system info:", err)
        })
        .finally(() => setLoading(false))
    })

    return () => cancelIdleCallback(idleHandle)
  }, [])

  useEffect(() => {
    const idleHandle = requestIdleCallback(() => {
      const cached = localStorage.getItem("sparkle:tweakInfo")
      if (cached) {
        try {
          setTweakInfo(JSON.parse(cached))
        } catch (err) {
          console.error("Failed to parse tweakInfo cache", err)
        }
      }

      invoke({ channel: "tweaks:fetch" })
        .then((tweaks) => {
          setTweakInfo(tweaks)
          localStorage.setItem("sparkle:tweakInfo", JSON.stringify(tweaks))
        })
        .catch((err) => {
          console.error("Error fetching tweak info:", err)
        })
    })

    return () => cancelIdleCallback(idleHandle)
  }, [])

  useEffect(() => {
    const idleHandle = requestIdleCallback(() => {
      fetchActiveTweaks()
    })

    return () => cancelIdleCallback(idleHandle)
  }, [])

  const checkWinget = async () => {
    setWingetChecking(true)
    try {
      const result = await invoke({ channel: "check-winget" })
      if (result.success) {
        setWingetInstalled(result.installed)
      } else {
        console.warn("Failed to check Winget status:", result.error)
        setWingetInstalled(false)
      }
    } catch (error) {
      console.error("Error checking Winget:", error)
      setWingetInstalled(false)
    } finally {
      setWingetChecking(false)
    }
  }

  const installWinget = async () => {
    setWingetInstalling(true)
    try {
      await invoke({ channel: "install-winget" })
      toast.success("Winget installation completed!")
      await checkWinget()
    } catch (error) {
      console.error("Error installing Winget:", error)
      toast.error("Failed to install Winget. Please try again.")
    } finally {
      setWingetInstalling(false)
    }
  }

  const dismissWingetWarning = () => {
    setWingetWarningDismissed(true)
    try {
      localStorage.setItem("sparkle:winget-warning-dismissed", "true")
    } catch (error) {
      console.error("Failed to save winget warning dismissal:", error)
    }
  }

  useEffect(() => {
    const idleHandle = requestIdleCallback(() => {
      checkWinget()
    })

    return () => cancelIdleCallback(idleHandle)
  }, [])

  const formatBytes = (bytes) => {
    if (bytes === 0 || !bytes) return "0 GB"
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB"
  }

  if (loading) {
    return (
      <RootDiv>
        <div className="flex items-center justify-center h-64 flex-col gap-5">
          <div className="">
            <div
              className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-sparkle-primary rounded-full ml-3"
              role="status"
              aria-label="loading"
            ></div>
          </div>
          <div className="text-sparkle-text-secondary">Loading system information...</div>
          <p className="text-sm text-sparkle-primary">
            You may use other parts of sparkle while this loads
          </p>
        </div>
      </RootDiv>
    )
  }

  return (
    <RootDiv>
      <div className="max-w-[1800px] mx-auto ">
        <Greeting />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoCard
            icon={Cpu}
            iconBgColor="bg-blue-500/10"
            iconColor="text-blue-500"
            title="CPU"
            subtitle="Processor Information"
            items={[
              { label: "Model", value: systemInfo?.cpu_model || "Unknown" },
              { label: "Cores", value: `${systemInfo?.cpu_cores || "0"} Cores` },
            ]}
          />

          <InfoCard
            icon={Gpu}
            iconBgColor="bg-teal-500/10"
            iconColor="text-teal-500"
            title="GPU"
            subtitle="Graphics Information"
            items={[
              { label: "Model", value: systemInfo?.gpu_model || "Unknown" },
              { label: "VRAM", value: systemInfo?.vram || "Unknown" },
            ]}
          />

          <InfoCard
            icon={MemoryStick}
            iconBgColor="bg-purple-500/10"
            iconColor="text-purple-500"
            title="Memory"
            subtitle="RAM Information"
            items={[
              { label: "Total Memory", value: formatBytes(systemInfo?.memory_total) },
              { label: "Type", value: systemInfo?.memory_type || "Unknown" },
            ]}
          />

          <InfoCard
            icon={MonitorCog}
            iconBgColor="bg-red-500/10"
            iconColor="text-red-500"
            title="System"
            subtitle="OS Information"
            items={[
              { label: "Operating System", value: systemInfo?.os || "Unknown" },
              { label: "Version", value: systemInfo?.os_version || "Unknown" },
            ]}
          />

          <InfoCard
            icon={HardDrive}
            iconBgColor="bg-orange-500/10"
            iconColor="text-orange-500"
            title="Storage"
            subtitle="Disk Information"
            items={[
              { label: "Primary Disk", value: systemInfo?.disk_model || "Unknown" },
              { label: "Total Space", value: systemInfo?.disk_size || "Unknown" },
            ]}
          />

          <InfoCard
            icon={Wrench}
            iconBgColor="bg-green-500/10"
            iconColor="text-green-500"
            title="Tweaks"
            subtitle="Tweaks Status"
            items={[
              { label: "Available Tweaks", value: `${tweakInfo?.length || 0} Tweaks` },
              { label: "Active Tweaks", value: `${activeTweaks.length || 0} Active` },
            ]}
          />
        </div>
        {!wingetInstalled && !wingetWarningDismissed && (
          <Card className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 w-full mt-4 flex gap-4 items-center relative">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <Download className="text-amber-500" size={24} />
            </div>
            <div className="flex-1">
              <h1 className="font-medium text-sparkle-text">Winget Not Installed</h1>
              <p className="text-sparkle-text-secondary">
                Winget is required to install apps from the Apps page. Click the button to install
                it.
              </p>
            </div>
            <div className="ml-auto flex gap-2 items-center">
              <Button
                variant="outline"
                className="flex items-center gap-2 border-amber-500/20 hover:bg-amber-500/10"
                onClick={installWinget}
                disabled={wingetInstalling || wingetChecking}
              >
                {wingetInstalling ? (
                  <>
                    <div className="animate-spin inline-block w-4 h-4 border-[2px] border-current border-t-transparent rounded-full" />
                    Installing...
                  </>
                ) : wingetChecking ? (
                  <>Checking...</>
                ) : (
                  <>
                    <Download size={18} /> Install Winget
                  </>
                )}
              </Button>
              <button
                onClick={dismissWingetWarning}
                className="p-1 text-sparkle-text-secondary hover:text-sparkle-text transition-colors"
                aria-label="Dismiss warning"
              >
                <X size={16} />
              </button>
            </div>
          </Card>
        )}
        <Card className="bg-sparkle-card backdrop-blur-xs rounded-xl border border-sparkle-border hover:shadow-xs overflow-hidden p-3 w-full mt-4 flex gap-4 items-center">
          <div className="p-3 bg-green-500/10 rounded-lg items-center justify-center text-center">
            <Wrench className="text-green-500" size={24} />
          </div>
          <div>
            <h1 className="font-medium text-sparkle-text">PC Running slow?</h1>
            <p className="text-sparkle-text-secondary">
              Try Using Tweaks to improve system performance
            </p>
          </div>
          <div className="ml-auto">
            <Button variant="outline" className="flex items-center gap-2" onClick={goToTweaks}>
              <Zap size={18} /> Tweaks
            </Button>
          </div>
        </Card>
        <p className="text-xs text-sparkle-text-secondary text-center mt-4">
          {usingCache ? "Loading latest system data..." : ""}
        </p>
      </div>
    </RootDiv>
  )
}

export default Home
