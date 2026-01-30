import React, { useEffect } from "react"

interface ModalProps {
  open: boolean
  onClose?: () => void
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export default function Modal({
  open,
  onClose,
  onOpenChange,
  children,
}: ModalProps): React.ReactElement {
  const handleClose = () => {
    onClose?.()
    onOpenChange?.(false)
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    if (open) window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, onClose, onOpenChange])

  return (
    <div
      onClick={handleClose}
      className={`
        fixed inset-0 flex justify-center items-center z-60 transition-all
        ${open ? "visible bg-black/60 backdrop-blur-xs" : "invisible bg-black/0"}
      `}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          transform transition-all
          duration-300 ease-out
          ${open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"}
        `}
      >
        {children}
      </div>
    </div>
  )
}
