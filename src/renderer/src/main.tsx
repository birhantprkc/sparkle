import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { HashRouter } from "react-router-dom"
import { init } from "@sentry/electron/renderer"
import { init as reactInit } from "@sentry/react"
import { PostHogProvider } from "posthog-js/react"

init({
  sendDefaultPpi: true,
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  reactInit,
})

const rootElement = document.getElementById("root")
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <PostHogProvider
        apiKey="phc_4vF2nxwQK17nl5wIQ4sT8UJae8iHZmsjGkPxgyQJhZo"
        options={{
          api_host: "https://us.i.posthog.com",
          capture_exceptions: true,
          debug: import.meta.env.MODE === "development",
        }}
      >
        <HashRouter>
          <App />
        </HashRouter>
      </PostHogProvider>
    </React.StrictMode>,
  )
}
