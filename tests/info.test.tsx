import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { Info } from "@/components/Info/Info"

describe("Info", () => {
  test("renders one card with placeholder text", () => {
    render(<Info />)

    expect(screen.getByText("hello world")).toBeVisible()
    expect(document.querySelectorAll('[data-slot="card"]')).toHaveLength(1)
  })
})
