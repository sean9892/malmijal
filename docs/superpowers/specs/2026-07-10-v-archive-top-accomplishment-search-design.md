# V-ARCHIVE Top Accomplishment Search

## Goal

Replace the placeholder image-generation left panel with a shadcn-based search interface that retrieves a V-ARCHIVE user's accomplishments by button mode, persists successful results in IndexedDB, and displays each mode in descending rating order.

## Scope

The feature covers the left panel only, plus the smallest layout adjustment required for it to fill and scroll within the existing resizable panel. It does not change the right panel, routing, navigation, deployment configuration, or theme behavior.

## User Experience

The panel is a full-height column containing:

1. A horizontal search form with a username input and a square search-icon button. Pressing Enter in the input and pressing the button invoke the same submit handler.
2. A shadcn `Tabs` control with `4B`, `5B`, `6B`, and `8B` tabs. All tabs are disabled until the initial 4B search succeeds.
3. A scrollable vertical result list built from shadcn `Item` components.

Before a successful search, the result area shows a quiet instructional or loading state. After a search, an empty mode shows an explicit empty state rather than a blank panel.

Each accomplishment item uses two lines:

- The first line shows its one-based rank in the sorted mode followed by the song title.
- The second line shows badges for `{pattern} {level}` and `floorName`, followed by score and rating text. A missing floor is labeled `Unranked`; a missing rating is displayed as an em dash.

The layout may wrap secondary metadata on narrow panels, but rank, title, badges, score, and rating remain available. The icon-only search button has an accessible name.

## Refresh and Loading Rules

An explicit form submission is the only refresh boundary.

- Empty or whitespace-only input shows a Sonner error and leaves the current session unchanged.
- A valid submission trims the input, invalidates or aborts outstanding requests, selects 4B, clears the submitted username's prior in-memory results and IndexedDB entries, and requests fresh 4B records.
- Tabs remain disabled until that 4B request succeeds.
- Selecting an unloaded 5B, 6B, or 8B tab requests that mode once and stores it. Returning to a successfully loaded tab does not issue another request.
- A failed mode remains failed until another valid form submission starts a new refresh cycle.
- Re-submitting the same username performs the same reset and refresh as submitting a different username.

A monotonically increasing search-generation identifier prevents an earlier, slower request from overwriting a newer search. Requests from the previous generation are aborted when possible.

## V-ARCHIVE Integration

The client uses the unauthenticated V2 record endpoint documented by V-ARCHIVE:

```text
GET https://v-archive.net/api/v2/archive/{encodedNickname}/button/{button}?sort=rating&order=desc
```

`button` is one of `4`, `5`, `6`, or `8`. The response must be a successful V2 payload whose returned button matches the requested mode and whose records contain the fields required by the panel. Invalid or unsuccessful payloads are treated as request failures.

The feature models the documented nullable `floor`, `floorName`, `rating`, `maxDjpower`, and `updatedAt` fields. It sorts a copied record array client-side by numeric rating descending even though the API is asked to sort, placing `null` ratings after rated records. Equal ratings preserve API order.

## Persistence

A small native IndexedDB adapter owns all browser storage operations. It stores one dataset per username key (`trim().toLowerCase()`) and button mode, including the canonical nickname returned by the API, records, and fetch timestamp.

The UI does not hydrate search results from IndexedDB. IndexedDB is persistence for other application work and future sessions, not an implicit refresh mechanism. A valid explicit search removes all stored modes for that submitted username before saving newly loaded modes. Records for unrelated usernames are preserved.

Each successful network response is placed in UI state immediately and then persisted. IndexedDB mutations use one read-write object store, and a generation check happens before a write is scheduled, so a new search's invalidation follows any already-scheduled writes and stale fetches cannot repopulate cleared data. If IndexedDB is unavailable or a transaction fails, the network result remains visible and a Sonner warning tells the user that local saving failed.

## Components and Modules

- `src/components/ImageGenerate/LeftPanel.tsx` owns form state, the active tab, per-mode load states, request generations, and rendering.
- `src/lib/vArchive.ts` owns V-ARCHIVE types, URL construction, fetching, payload validation, and stable rating sorting.
- `src/lib/vArchiveDb.ts` owns IndexedDB opening, per-mode writes, and per-username invalidation.
- shadcn `Input`, `Button`, `Tabs`, `Item`, `Badge`, `Skeleton`, and `Sonner` components provide the interface, with Lucide icons for search and loading feedback.
- `src/components/ImageGenerate/ImageGenerate.tsx` receives only height and overflow class corrections needed for the left panel's internal scroller.

No cache or data-fetching framework is introduced. The request lifecycle remains explicit in the panel, while network and persistence details stay independently testable.

## State Model

The panel tracks:

- The editable input value and last successfully submitted username.
- The active button mode, initially 4B for each search generation.
- A per-mode state of `idle`, `loading`, `success`, or `error`, with records attached to successful states.
- The current search generation and active abort controllers.

During the initial 4B load, the search form indicates activity and the tabs remain disabled. After activation, modes can load independently. Starting a new search returns every mode to `idle` before 4B becomes `loading`.

## Error Handling

- Empty input: show a specific Sonner error asking for a V-ARCHIVE username; do not mutate results.
- Unknown username: surface a friendly not-found message based on the API's 404/error code 101 response.
- Other non-success responses, malformed payloads, and network failures: show a general search failure toast and an inline error state.
- Lazy-mode failure: retain an inline error for that mode and require a new explicit search to retry.
- Persistence failure: retain and display fetched data, but warn through Sonner.
- Stale or aborted request: ignore it without showing an error for the current generation.

## Testing

Add Vitest with jsdom, React Testing Library, user-event, and fake-indexeddb while keeping the existing Node test suite.

Unit tests cover:

- Encoded API URL construction and allowed button modes.
- Successful response validation and documented failure mapping.
- Stable descending rating sorting with nullable ratings.
- IndexedDB per-mode replacement and per-username invalidation.

Component tests render the real panel and cover:

- Disabled initial tabs and both form submission paths.
- Empty-input Sonner feedback without state mutation.
- Successful 4B loading, sorting, persistence, and tab activation.
- Lazy loading each additional mode at most once per search generation.
- No request when revisiting a loaded tab.
- Explicit re-submission resetting and refreshing results.
- Network/API errors, persistence warnings, empty modes, and stale-response protection.

External boundaries (`fetch` and IndexedDB) are controlled in tests; component state and interactions are exercised normally. Final verification runs all Node and UI tests, ESLint, TypeScript checking, the production build, and a whitespace diff check.

## Success Criteria

- The placeholder panel is replaced by the specified accessible shadcn interface.
- Only explicit valid form submissions refresh a search session.
- 4B loads first; 5B, 6B, and 8B load only on their first selection in that session.
- Results are visibly sorted by rating descending with deterministic null handling.
- Successful mode results are saved to IndexedDB without blocking display when persistence fails.
- All defined loading, empty, and error states are understandable and do not leak stale results.
- Automated tests, linting, type checking, and the production build pass.
