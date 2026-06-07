import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("electron-log", () => ({
  default: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
  log: vi.fn(), error: vi.fn(), warn: vi.fn(),
}))

vi.mock("systeminformation", () => ({
  default: { graphics: vi.fn() },
}))

vi.mock("@main/powershell", () => ({
  executePowerShell: vi.fn(),
  checkChocolatey: vi.fn(),
}))

vi.mock("@main/gpu", () => ({
  detectGPU: vi.fn(),
}))

const mockExecFile = vi.fn()
vi.mock("child_process", () => ({
  execFile: mockExecFile,
  exec: vi.fn(),
}))

vi.mock("electron", () => ({
  ipcMain: { handle: vi.fn(), removeHandler: vi.fn() },
  shell: { openPath: vi.fn(), openExternal: vi.fn() },
}))

const { checkWinget } = await import("@main/system")

beforeEach(() => {
  vi.clearAllMocks()
})

describe("checkWinget", () => {
  it("returns installed=true when winget command succeeds", async () => {
    mockExecFile.mockImplementation((...args) => {
      const callback = args[args.length - 1]
      callback(null, { stdout: "v1.2.3" })
    })

    const result = await checkWinget()

    expect(result).toEqual({ success: true, installed: true })
    expect(mockExecFile).toHaveBeenCalledWith("winget", ["--version"], expect.any(Function))
  })

  it("returns installed=false when winget command fails", async () => {
    mockExecFile.mockImplementation((...args) => {
      const callback = args[args.length - 1]
      callback(new Error("not found"))
    })

    const result = await checkWinget()

    expect(result).toEqual({ success: true, installed: false })
  })

  it("calls execFile with correct arguments", async () => {
    mockExecFile.mockImplementation((...args) => {
      const callback = args[args.length - 1]
      callback(null, { stdout: "v1.2.3" })
    })

    await checkWinget()

    expect(mockExecFile).toHaveBeenCalledWith("winget", ["--version"], expect.any(Function))
  })
})
