# Remove Theme Keyboard Shortcut

## Goal

Pressing `d` must no longer change the application's color theme. Theme changes initiated through the navbar button and the existing `ThemeProvider` API must continue to work.

## Design

Remove the global `keydown` effect from `ThemeProvider`. Because that effect is the only consumer of `isEditableTarget`, remove the helper as dead code. Do not change theme initialization, persistence, system-theme synchronization, cross-tab storage synchronization, or the navbar.

## Verification

Add a focused regression test that fails while `ThemeProvider` still registers a keyboard shortcut and passes after the listener is removed. Run the regression test, lint, type checking, and the production build.
