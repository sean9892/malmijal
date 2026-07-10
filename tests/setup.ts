import "@testing-library/jest-dom/vitest"
import "fake-indexeddb/auto"
import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

class ResizeObserverStub implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Object.defineProperty(window, "ResizeObserver", {
  configurable: true,
  value: ResizeObserverStub,
})

Object.defineProperty(Element.prototype, "scrollIntoView", {
  configurable: true,
  value: vi.fn(),
})

afterEach(() => {
  cleanup()
})
