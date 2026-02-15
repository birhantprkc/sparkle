import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import ErrorBoundary from "./components/ErrorBoundary"
import { HashRouter } from "react-router-dom"
import mixpanel from "mixpanel-browser"
import { init } from "@sentry/electron/renderer"
import { init as reactInit } from "@sentry/react"

init({
  sendDefaultPpi: true,
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  reactInit,
})

if (localStorage.getItem("analyticsDisabled") !== "true") {
  mixpanel.init("68a972fa07a32b2c604205e24bd588db", {
    debug: import.meta.env.MODE === "development",
    track_pageview: true,
    persistence: "localStorage",
    autocapture: true,
    record_sessions_percent: 100,
    record_mask_text_selector: "",
  })

  let userId = localStorage.getItem("mixpanel_user_id")
  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem("mixpanel_user_id", userId)
  }
  mixpanel.identify(userId)
}

const rootElement = document.getElementById("root")
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <HashRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </HashRouter>
    </React.StrictMode>,
  )
}
