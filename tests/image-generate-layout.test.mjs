import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = await readFile(
  new URL(
    "../src/components/ImageGenerate/ImageGenerate.tsx",
    import.meta.url
  ),
  "utf8"
)

test("resizable panels contain full-height scrolling children", () => {
  assert.equal(
    source.match(/defaultSize="50%"\s+className="min-h-0 overflow-hidden"/g)?.length,
    2
  )
  assert.equal(
    source.match(
      /className="flex h-full min-h-0 w-full items-center justify-center"/g
    )?.length,
    2
  )
})
