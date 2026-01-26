import { useEffect, useState } from "react"
import { RefreshCw, PlusCircle, Shield, RotateCcw, Loader2, Search } from "lucide-react"
import RootDiv from "@/components/rootdiv"
import { invoke } from "@/lib/electron"
import Button from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import { toast } from "react-toastify"
import { Trash } from "lucide-react"
import log from "electron-log/renderer"
import { LargeInput } from "@/components/ui/input"

export default function RestorePointManager() {
  const [restorePoints, setRestorePoints] = useState<RestorePointList>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: string | null
    restorePoint: any | null
  }>({
    isOpen: false,
    type: null,
    restorePoint: null,
  })

  type RestorePoint = {
    SequenceNumber: number
    Description: string
    CreationTime: string
    EventType: number
    RestorePointType: number
  }

  type RestorePointList = RestorePoint[]

  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [customName, setCustomName] = useState("")

  const fetchRestorePoints = async () => {
    setLoading(true)
    try {
      const response = await invoke({ channel: "get-restore-points" })
      if (response.success && Array.isArray(response.points)) {
        const sorted = response.points.sort((a, b) => {
          const parse = (str: string) =>
            new Date(
              `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}T${str.slice(8, 10)}:${str.slice(10, 12)}:${str.slice(12, 14)}`,
            ).getTime()

          return parse(b.CreationTime) - parse(a.CreationTime)
        })
        setRestorePoints(sorted)
      } else {
        toast.error("Failed to load restore points. Please check logs")
        log.error("Failed to load restore points:", response)
      }
    } catch (error) {
      toast.error(`Failed to load restore points. Please check logs`)
      console.error(error)
      log.error("Failed to load restore points:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRestorePoints()
  }, [])

  const handleCreateRestorePoint = async () => {
    setProcessing(true)
    try {
      await invoke({ channel: "create-sparkle-restore-point" })
      toast.success("Restore point created!")
      await fetchRestorePoints()
    } catch (err) {
      toast.error("Failed to create restore point.")
      log.error("Failed to create restore point:", err)
    }
    setProcessing(false)
  }

  const handleRestore = (restorePoint) => {
    setModalState({ isOpen: true, type: "restore", restorePoint })
  }

  const executeRestore = async () => {
    setProcessing(true)
    try {
      await invoke({
        channel: "restore-restore-point",
        payload: modalState.restorePoint.SequenceNumber,
      })
      toast.success("System restore started. Your PC may restart.")
    } catch (err) {
      toast.error("Failed to start system restore.")
      log.error("Failed to start system restore:", err)
    }
    setProcessing(false)
    setModalState({ isOpen: false, type: null, restorePoint: null })
  }

  const handleCustomRestorePoint = async () => {
    setProcessing(true)
    try {
      if (!customName.trim()) {
        toast.error("Please enter a name for the restore point.")
        setProcessing(false)
        return
      }
      await invoke({ channel: "create-restore-point", payload: customName })
      toast.success("Restore point created!")
      setCustomModalOpen(false)
      setCustomName("")
      await fetchRestorePoints()
    } catch (err) {
      toast.error("Failed to create restore point.")
      log.error("Failed to create restore point:", err)
    }
    setProcessing(false)
  }
  const handleDeleteAll = async () => {
    setProcessing(true)
    await invoke({ channel: "delete-all-restore-points" })
    toast.success("All restore points deleted successfully.")
    setProcessing(false)
    await fetchRestorePoints()
  }
  const filteredRestorePoints = restorePoints.filter((rp: RestorePoint) =>
    (rp.Description || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )
  console.log(restorePoints)
  return (
    <>
      <RootDiv>
        <div className="h-full max-w-full space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="relative w-full md:w-64 ml-1 mt-1">
              <LargeInput
                placeholder="Search Restore Points..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={Search}
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="danger"
                onClick={handleDeleteAll}
                disabled={loading || processing}
                className="flex items-center gap-2"
              >
                <Trash size={16} /> Delete All
              </Button>
              <Button
                variant="secondary"
                onClick={fetchRestorePoints}
                className="flex items-center gap-2"
                disabled={loading || processing}
              >
                <RefreshCw size={16} /> Refresh
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateRestorePoint}
                className="flex items-center gap-2"
                disabled={loading || processing}
              >
                {processing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <PlusCircle size={16} />
                )}
                Quick Restore Point
              </Button>
              <Button
                variant="primary"
                onClick={() => setCustomModalOpen(true)}
                disabled={loading || processing}
              >
                Custom Restore Point
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 size={32} className="text-sparkle-primary animate-spin" />
            </div>
          ) : filteredRestorePoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-sparkle-card border border-sparkle-border rounded-lg">
              <div className="p-4 bg-sparkle-secondary rounded-full mb-4">
                <Shield size={28} className="text-sparkle-text" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-sparkle-text">
                No Restore Points Found
              </h3>
              <p className="text-sparkle-text-secondary max-w-sm mb-4">
                {searchQuery
                  ? "No restore points match your search."
                  : "Create a restore point to preserve your system state. You can restore your system to any point when needed."}
              </p>
              {!searchQuery && (
                <Button
                  variant="primary"
                  icon={<PlusCircle size={16} />}
                  onClick={handleCreateRestorePoint}
                  disabled={processing}
                >
                  Create a Quick Restore Point
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-sparkle-card border border-sparkle-border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-sparkle-text-secondary uppercase bg-sparkle-card sticky top-0">
                    <tr>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4 w-32 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRestorePoints.map((rp, index) => (
                      <tr key={index} className="border-t border-sparkle-border">
                        <td className="px-6 py-4 font-medium text-sparkle-text">
                          {rp.Description}
                        </td>
                        <td className="px-14 py-4 text-center">
                          <Button
                            variant="outline"
                            className="p-2! gap-2"
                            onClick={() => handleRestore(rp)}
                            disabled={processing}
                            title="Restore System"
                          >
                            <RotateCcw size={16} />
                            Restore
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <p className="text-center text-sparkle-text-muted mt-4">
            Listing restore points is a beta feature and may be unreliable, but creating restore
            points works as expected.
          </p>
        </div>
      </RootDiv>
      <Modal
        open={modalState.isOpen}
        onClose={() =>
          !processing && setModalState({ isOpen: false, type: null, restorePoint: null })
        }
      >
        {modalState.type === "restore" && modalState.restorePoint && (
          <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-6 shadow-xl max-w-lg w-full mx-4 pb-0">
            <h3 className="text-lg font-medium text-sparkle-text">Restore System</h3>

            <div className="p-4 pr-0">
              <p className="text-sparkle-text-secondary mb-4">
                Are you sure you want to restore your system to{" "}
                <span className="font-bold">"{modalState.restorePoint.Description}"?</span> Your PC
                will restart shortly. and the restore point will be applied. <br /> <br />
                Your files will not be affected, but recently installed applications and settings
                may be lost.
                <br /> <br />
                This will revert all changes sparkle has made to your system since this restore
                point was created.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() =>
                    !processing && setModalState({ isOpen: false, type: null, restorePoint: null })
                  }
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button variant="primary" onClick={executeRestore} disabled={processing}>
                  {processing ? <Loader2 size={16} className="animate-spin" /> : "Restore"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={customModalOpen} onClose={() => !processing && setCustomModalOpen(false)}>
        <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-6 shadow-xl max-w-lg w-full mx-4 pb-0">
          <h3 className="text-lg font-medium text-sparkle-text">Create Custom Restore Point</h3>

          <div className="p-4 space-y-4">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter restore point name"
              className="w-full px-3 py-2 bg-sparkle-card border border-sparkle-border rounded-lg text-sparkle-text placeholder-sparkle-text-secondary focus:outline-hidden focus:ring-2 focus:ring-sparkle-primary focus:border-transparent transition-colors"
              disabled={processing}
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => !processing && setCustomModalOpen(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCustomRestorePoint}
                disabled={processing || !customName.trim()}
              >
                {processing ? <Loader2 size={16} className="animate-spin" /> : "Create"}
              </Button>
            </div>
            <p className="text-xs text-center text-sparkle-text-muted">
              This may take a while depending on your hardware
            </p>
          </div>
        </div>
      </Modal>
    </>
  )
}
