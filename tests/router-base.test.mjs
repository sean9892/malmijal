import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("the browser router uses Vite's deployment base", async () => {
  const mainSource = await readFile(
    new URL("../src/main.tsx", import.meta.url),
    "utf8"
  )

  assert.match(
    mainSource,
    /<BrowserRouter\s+basename=\{import\.meta\.env\.BASE_URL\}>/
  )
})
