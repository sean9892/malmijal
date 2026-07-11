import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const html = await readFile(new URL("../index.html", import.meta.url), "utf8")

test("favicon uses the Vite public asset path under the deployment base", () => {
  const faviconLinks = [
    ...html.matchAll(/<link\s+[^>]*rel="icon"[^>]*>/g),
  ].map((match) => match[0])

  assert.equal(faviconLinks.length, 1)
  assert.match(faviconLinks[0], /type="image\/x-icon"/)
  assert.match(faviconLinks[0], /href="%BASE_URL%images\/favicon\.ico"/)
  assert.doesNotMatch(faviconLinks[0], /public\//)
  assert.doesNotMatch(faviconLinks[0], /import\.meta\.env/)
})
