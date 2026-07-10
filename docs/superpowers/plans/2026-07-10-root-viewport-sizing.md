# Root Viewport Sizing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `#root` match the visible browser viewport and prevent root-level scrollbars.

**Architecture:** Define the viewport contract directly on the React mount element in the existing global stylesheet. Add a dependency-free Node test that reads the stylesheet and guards the three required declarations against regression.

**Tech Stack:** CSS, Tailwind CSS preflight, Node.js built-in test runner, Vite, TypeScript, React

## Global Constraints

- Change only the global CSS rule for `#root`; do not change component files or `html`/`body` sizing rules.
- Use `width: 100%`, `height: 100dvh`, and `overflow: hidden` exactly.
- Add no runtime or development dependencies.
- Preserve all existing user changes in the working tree.

---

### Task 1: Establish and Implement the Root Viewport Contract

**Files:**
- Create: `test/root-viewport.test.mjs`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: the global stylesheet loaded by `src/main.tsx` and the existing `npm test` command (`node --test`)
- Produces: a `#root` CSS rule whose declarations are guarded by `test/root-viewport.test.mjs`

- [ ] **Step 1: Write the failing CSS contract test**

Create `test/root-viewport.test.mjs`:

```js
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const stylesheet = await readFile(
  new URL("../src/index.css", import.meta.url),
  "utf8"
)

test("the root element exactly fills the dynamic viewport without scrollbars", () => {
  const declarations = stylesheet.match(
    /#root\s*\{(?<declarations>[^}]*)\}/
  )?.groups?.declarations

  assert.ok(declarations, "#root must have an explicit global CSS rule")
  assert.match(declarations, /\bwidth\s*:\s*100%\s*;/)
  assert.match(declarations, /\bheight\s*:\s*100dvh\s*;/)
  assert.match(declarations, /\boverflow\s*:\s*hidden\s*;/)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- test/root-viewport.test.mjs
```

Expected: FAIL with `#root must have an explicit global CSS rule` because `src/index.css` does not yet define `#root`.

- [ ] **Step 3: Add the minimal root rule**

Add this rule inside the existing `@layer base` block in `src/index.css`, before the `body` rule:

```css
  #root {
    width: 100%;
    height: 100dvh;
    overflow: hidden;
  }
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
npm test -- test/root-viewport.test.mjs
```

Expected: one passing test and zero failures.

- [ ] **Step 5: Run the full project verification**

Run:

```bash
npm test
npm run build
npm run typecheck
npm run lint
```

Expected: every command exits with status 0. The build emits the Vite production bundle, TypeScript reports no errors, and ESLint reports no errors.

- [ ] **Step 6: Verify the viewport behavior in a browser**

Run `npm run dev`, open the local Vite URL, and inspect the page at desktop and mobile viewport sizes. In the browser console, run:

```js
const root = document.querySelector("#root")
const bounds = root.getBoundingClientRect()
console.table({
  rootWidth: bounds.width,
  viewportWidth: window.innerWidth,
  rootHeight: bounds.height,
  viewportHeight: window.innerHeight,
  horizontalPageScroll: document.documentElement.scrollWidth > window.innerWidth,
  verticalPageScroll: document.documentElement.scrollHeight > window.innerHeight,
})
```

Expected: root and viewport dimensions match, and both page-scroll values are `false`.

- [ ] **Step 7: Commit the implementation**

```bash
git add src/index.css test/root-viewport.test.mjs
git commit -m "fix: constrain root to viewport"
```
