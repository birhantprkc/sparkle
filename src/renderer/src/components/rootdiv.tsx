import { useEffect, useState } from "react"

interface RootDivProps {
  children: React.ReactNode
  [key: string]: any
}

function RootDiv({ children, ...props }: RootDivProps): React.ReactElement {
  const [style, setStyle] = useState({
    opacity: 0,
    transform: "translateY(90px)",
    transition:
      "opacity 0.6s cubic-bezier(0.075,0.82,0.165,1), transform 0.6s cubic-bezier(0.075,0.82,0.165,1)",
  })

  useEffect(() => {
    const timeout = setTimeout(() => {
      setStyle((prev) => ({
        ...prev,
        opacity: 1,
        transform: "translateY(0)",
      }))
    }, 10)

    return () => {
      setStyle((prev) => ({
        ...prev,
        opacity: 0,
        transform: "translateY(90px)",
      }))
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div
      style={{
        ...style,
        height: "calc(100vh - 50px)",
        overflowY: "auto",
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export default RootDiv
