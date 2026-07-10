# Root Viewport Sizing Design

## Goal

Make the React mount element, `#root`, occupy exactly the visible browser viewport without exposing horizontal or vertical scrollbars.

## Scope

This change is limited to the global CSS rule for `#root`. The application wrapper, navbar, resizable panels, and their internal overflow behavior remain unchanged.

## Design

Add a `#root` rule to `src/index.css` with:

- `width: 100%` so the root spans the available viewport width without the scrollbar-related overflow risk of `100vw`.
- `height: 100dvh` so the root tracks the visible dynamic viewport, including changes caused by mobile browser chrome.
- `overflow: hidden` so descendant overflow is clipped at the root and does not produce page-level scrollbars.

The existing Tailwind preflight already removes the browser's default body margin, so the root can align with every viewport edge without additional `html` or `body` rules.

## Acceptance Criteria

- The bounding width of `#root` equals the viewport width.
- The bounding height of `#root` equals the dynamic viewport height.
- The page exposes neither a horizontal nor a vertical scrollbar.
- No component files or `html`/`body` sizing rules are changed.
- The project still passes its build, type-check, and lint checks.

## Verification

Run the existing build, type-check, and lint commands. Verify the root geometry and absence of document-level scrolling in a browser viewport after the CSS change.
