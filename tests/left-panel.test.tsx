import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { LeftPanel } from "@/components/ImageGenerate/LeftPanel"
import type { VArchiveButton, VArchiveRecord } from "@/lib/vArchive"

const databaseMocks = vi.hoisted(() => ({
  clear: vi.fn().mockResolvedValue(undefined),
  save: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/vArchiveDb", () => ({
  clearVArchiveDatasets: databaseMocks.clear,
  saveVArchiveDataset: databaseMocks.save,
}))

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => null,
}))

vi.mock("sonner", async () => {
  const actual = await vi.importActual<typeof import("sonner")>("sonner")
  return {
    ...actual,
    toast: {
      error: vi.fn(),
      warning: vi.fn(),
    },
  }
})

function record(
  name: string,
  rating: number | null,
  overrides: Partial<VArchiveRecord> = {}
): VArchiveRecord {
  return {
    title: name.length,
    name,
    dlcCode: "R",
    pattern: "HD",
    level: 10,
    floor: rating === null ? null : 100,
    floorName: rating === null ? null : "10.0",
    newTab: false,
    maxRating: 2,
    score: 99.5,
    maxCombo: true,
    rating,
    djpower: 50,
    maxDjpower: 2,
    updatedAt: "2026-07-10T00:00:00.000Z",
    ...overrides,
  }
}

function successResponse(
  nickname: string,
  button: VArchiveButton,
  records: VArchiveRecord[]
) {
  return new Response(
    JSON.stringify({
      success: true,
      nickname,
      button,
      count: records.length,
      records,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  )
}

function fetchMock() {
  return vi.mocked(globalThis.fetch)
}

describe("LeftPanel", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
    databaseMocks.clear.mockResolvedValue(undefined)
    databaseMocks.save.mockResolvedValue(undefined)
  })

  test("starts disabled and rejects empty Enter submission", async () => {
    const user = userEvent.setup()
    render(<LeftPanel />)

    for (const name of ["4B", "5B", "6B", "8B"]) {
      expect(screen.getByRole("tab", { name })).toBeDisabled()
    }

    await user.type(
      screen.getByRole("textbox", { name: "V-ARCHIVE username" }),
      "   {Enter}"
    )

    expect(toast.error).toHaveBeenCalledWith("Enter a V-ARCHIVE username.")
    expect(fetchMock()).not.toHaveBeenCalled()
  })

  test("search button loads, sorts, stores 4B, and enables tabs", async () => {
    const user = userEvent.setup()
    fetchMock().mockResolvedValueOnce(
      successResponse("Alice", 4, [
        record("Unrated", null),
        record("Top Song", 171.234, {
          title: 12345,
          pattern: "SC",
          level: 15,
          floorName: "17.3",
        }),
        record("Second Song", 1.1),
      ])
    )
    render(<LeftPanel />)

    await user.type(
      screen.getByRole("textbox", { name: "V-ARCHIVE username" }),
      "Alice"
    )
    await user.click(screen.getByRole("button", { name: "Search" }))

    const items = await screen.findAllByRole("listitem")
    const topJacket = within(items[0]!).getByRole("img", {
      name: "Top Song jacket",
    })
    expect(topJacket).toHaveAttribute(
      "src",
      "https://v-archive.net/s3/images/jackets/12345.jpg"
    )
    expect(items[0]!.firstElementChild).toContainElement(topJacket)
    expect(within(items[0]!).getByText("Top Song")).toBeVisible()
    expect(within(items[1]!).getByText("Second Song")).toBeVisible()
    expect(within(items[2]!).getByText("Unrated")).toBeVisible()
    const scBadge = screen.getByText("SC 15")
    expect(scBadge).toBeVisible()
    expect(scBadge).toHaveClass("bg-primary", "text-primary-foreground")
    expect(screen.getByText("17.3")).toBeVisible()
    expect(screen.getByText("Unranked")).toBeVisible()
    expect(items[0]!).toHaveTextContent("Score: 99.50%")
    expect(items[0]!).toHaveTextContent("Rating: 171.23")
    expect(items[2]!).toHaveTextContent("Rating: —")
    expect(databaseMocks.clear).toHaveBeenCalledWith("Alice")
    expect(databaseMocks.save).toHaveBeenCalledWith(
      "Alice",
      expect.objectContaining({ button: 4 })
    )

    for (const name of ["4B", "5B", "6B", "8B"]) {
      expect(screen.getByRole("tab", { name })).toBeEnabled()
    }
  })

  test("lazy-loads an additional mode once and reuses it on revisit", async () => {
    const user = userEvent.setup()
    fetchMock()
      .mockResolvedValueOnce(successResponse("Alice", 4, [record("A4", 2)]))
      .mockResolvedValueOnce(successResponse("Alice", 5, [record("A5", 3)]))
    render(<LeftPanel />)

    await user.type(
      screen.getByRole("textbox", { name: "V-ARCHIVE username" }),
      "Alice{Enter}"
    )
    await screen.findByText("A4")
    await user.click(screen.getByRole("tab", { name: "5B" }))
    await screen.findByText("A5")
    await user.click(screen.getByRole("tab", { name: "4B" }))
    await user.click(screen.getByRole("tab", { name: "5B" }))

    expect(fetchMock()).toHaveBeenCalledTimes(2)
  })

  test("does not retry a failed lazy mode before a new search", async () => {
    const user = userEvent.setup()
    fetchMock()
      .mockResolvedValueOnce(successResponse("Alice", 4, [record("A4", 2)]))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            errorCode: 999,
            message: "server error",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    render(<LeftPanel />)

    await user.type(
      screen.getByRole("textbox", { name: "V-ARCHIVE username" }),
      "Alice{Enter}"
    )
    await screen.findByText("A4")
    await user.click(screen.getByRole("tab", { name: "5B" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load V-ARCHIVE records."
    )
    await user.click(screen.getByRole("tab", { name: "4B" }))
    await user.click(screen.getByRole("tab", { name: "5B" }))

    expect(fetchMock()).toHaveBeenCalledTimes(2)
  })

  test("re-submitting the same username refreshes 4B", async () => {
    const user = userEvent.setup()
    fetchMock()
      .mockResolvedValueOnce(
        successResponse("Alice", 4, [record("Old Result", 2)])
      )
      .mockResolvedValueOnce(
        successResponse("Alice", 4, [record("Fresh Result", 3)])
      )
    render(<LeftPanel />)

    await user.type(
      screen.getByRole("textbox", { name: "V-ARCHIVE username" }),
      "Alice{Enter}"
    )
    await screen.findByText("Old Result")
    await user.click(screen.getByRole("button", { name: "Search" }))

    expect(await screen.findByText("Fresh Result")).toBeVisible()
    expect(screen.queryByText("Old Result")).not.toBeInTheDocument()
    expect(fetchMock()).toHaveBeenCalledTimes(2)
    expect(databaseMocks.clear).toHaveBeenCalledTimes(2)
  })

  test("explicit resubmission resets modes and ignores an older response", async () => {
    const user = userEvent.setup()
    let resolveAlice: ((response: Response) => void) | undefined
    fetchMock()
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveAlice = resolve
          })
      )
      .mockResolvedValueOnce(successResponse("Bob", 4, [record("Bob Song", 3)]))
    render(<LeftPanel />)

    const input = screen.getByRole("textbox", {
      name: "V-ARCHIVE username",
    })
    await user.type(input, "Alice{Enter}")
    await user.clear(input)
    await user.type(input, "Bob{Enter}")
    await screen.findByText("Bob Song")

    resolveAlice?.(successResponse("Alice", 4, [record("Stale Alice Song", 4)]))
    await waitFor(() => {
      expect(screen.queryByText("Stale Alice Song")).not.toBeInTheDocument()
    })
    expect(databaseMocks.clear).toHaveBeenNthCalledWith(1, "Alice")
    expect(databaseMocks.clear).toHaveBeenNthCalledWith(2, "Bob")
  })

  test("shows request errors and persistence warnings without hiding data", async () => {
    const user = userEvent.setup()
    fetchMock()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            errorCode: 101,
            message: "유저를 찾을 수 없습니다",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        successResponse("Alice", 4, [record("Visible Song", 2)])
      )
    databaseMocks.save.mockRejectedValueOnce(new Error("blocked"))
    render(<LeftPanel />)

    const input = screen.getByRole("textbox", {
      name: "V-ARCHIVE username",
    })
    await user.type(input, "missing{Enter}")
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "V-ARCHIVE user not found."
    )
    expect(toast.error).toHaveBeenCalledWith("V-ARCHIVE user not found.")

    await user.clear(input)
    await user.type(input, "Alice{Enter}")
    expect(await screen.findByText("Visible Song")).toBeVisible()
    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(
        "Records loaded, but could not be saved locally."
      )
    })
  })

  test("renders an explicit empty state for a successful empty mode", async () => {
    const user = userEvent.setup()
    fetchMock().mockResolvedValueOnce(successResponse("Alice", 4, []))
    render(<LeftPanel />)

    await user.type(
      screen.getByRole("textbox", { name: "V-ARCHIVE username" }),
      "Alice{Enter}"
    )

    expect(
      await screen.findByText("No 4B accomplishments found.")
    ).toBeVisible()
  })
})
