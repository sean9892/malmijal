import * as React from "react"
import { Loader2, Search } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  fetchVArchiveRecords,
  isVArchiveButton,
  V_ARCHIVE_BUTTONS,
  VArchiveApiError,
  type VArchiveButton,
  type VArchiveRecord,
} from "@/lib/vArchive"
import { clearVArchiveDatasets, saveVArchiveDataset } from "@/lib/vArchiveDb"

type ModeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; records: VArchiveRecord[] }
  | { status: "error"; message: string }

type ModeStates = Record<VArchiveButton, ModeState>

function initialModeStates(): ModeStates {
  return {
    4: { status: "idle" },
    5: { status: "idle" },
    6: { status: "idle" },
    8: { status: "idle" },
  }
}

function metric(value: number) {
  return value.toFixed(4)
}

function isAbortError(error: unknown) {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  )
}

function requestMessage(error: unknown) {
  if (error instanceof VArchiveApiError) {
    return error.message
  }
  return "Could not load V-ARCHIVE records."
}

function LoadingItems() {
  return (
    <div
      className="flex flex-col gap-2"
      role="status"
      aria-label="Loading accomplishments"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <div className="space-y-2 rounded-lg border p-3" key={index}>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}

function Results({
  button,
  hasSearch,
  state,
}: {
  button: VArchiveButton
  hasSearch: boolean
  state: ModeState
}) {
  if (state.status === "loading") {
    return <LoadingItems />
  }

  if (state.status === "error") {
    return (
      <div
        className="flex min-h-40 items-center justify-center px-6 text-center text-sm text-destructive"
        role="alert"
      >
        {state.message}
      </div>
    )
  }

  if (state.status === "idle") {
    return (
      <div className="flex min-h-40 items-center justify-center px-6 text-center text-sm text-muted-foreground">
        {hasSearch
          ? "Choose this mode to load its accomplishments."
          : "Search for a V-ARCHIVE user to view top accomplishments."}
      </div>
    )
  }

  if (state.records.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center px-6 text-center text-sm text-muted-foreground">
        No {button}B accomplishments found.
      </div>
    )
  }

  return (
    <ItemGroup className="gap-2 pr-1">
      {state.records.map((record, index) => (
        <Item
          key={record.title + ":" + record.pattern}
          role="listitem"
          variant="outline"
          className="items-start"
        >
          <ItemMedia variant="image" className="mt-0.5">
            <img
              src={`https://v-archive.net/s3/images/jackets/${record.title}.jpg`}
              alt={`${record.name} jacket`}
              loading="lazy"
            />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle className="w-full min-w-0">
              <span className="w-6 shrink-0 text-right text-muted-foreground tabular-nums">
                {index + 1}
              </span>
              <span className="truncate">{record.name}</span>
            </ItemTitle>
            <ItemDescription className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {record.pattern} {record.level}
              </Badge>
              <Badge variant="outline">{record.floorName ?? "Unranked"}</Badge>
              <span className="ml-auto tabular-nums">
                Score {metric(record.score)}
              </span>
              <span className="tabular-nums">
                Rating {record.rating === null ? "—" : metric(record.rating)}
              </span>
            </ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  )
}

export function LeftPanel() {
  const [username, setUsername] = React.useState("")
  const [submittedUsername, setSubmittedUsername] = React.useState("")
  const [activeButton, setActiveButton] = React.useState<VArchiveButton>(4)
  const [modeStates, setModeStates] =
    React.useState<ModeStates>(initialModeStates)
  const [tabsEnabled, setTabsEnabled] = React.useState(false)
  const generationRef = React.useRef(0)
  const controllersRef = React.useRef(
    new Map<VArchiveButton, AbortController>()
  )

  React.useEffect(() => {
    const controllers = controllersRef.current
    return () => {
      for (const controller of controllers.values()) {
        controller.abort()
      }
    }
  }, [])

  const loadMode = React.useCallback(
    async (nickname: string, button: VArchiveButton, generation: number) => {
      const controller = new AbortController()
      controllersRef.current.set(button, controller)
      setModeStates((current) => ({
        ...current,
        [button]: { status: "loading" },
      }))

      try {
        const response = await fetchVArchiveRecords(nickname, button, {
          signal: controller.signal,
        })
        if (generation !== generationRef.current) {
          return
        }

        setModeStates((current) => ({
          ...current,
          [button]: {
            status: "success",
            records: response.records,
          },
        }))
        if (button === 4) {
          setTabsEnabled(true)
        }

        void saveVArchiveDataset(nickname, response).catch(() => {
          if (generation === generationRef.current) {
            toast.warning("Records loaded, but could not be saved locally.")
          }
        })
      } catch (error) {
        if (generation !== generationRef.current || isAbortError(error)) {
          return
        }

        const message = requestMessage(error)
        setModeStates((current) => ({
          ...current,
          [button]: { status: "error", message },
        }))
        if (button === 4) {
          setTabsEnabled(false)
        }
        toast.error(message)
      } finally {
        if (controllersRef.current.get(button) === controller) {
          controllersRef.current.delete(button)
        }
      }
    },
    []
  )

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nickname = username.trim()
    if (nickname.length === 0) {
      toast.error("Enter a V-ARCHIVE username.")
      return
    }

    generationRef.current += 1
    const generation = generationRef.current
    for (const controller of controllersRef.current.values()) {
      controller.abort()
    }
    controllersRef.current.clear()

    setSubmittedUsername(nickname)
    setActiveButton(4)
    setTabsEnabled(false)
    setModeStates(initialModeStates())

    void clearVArchiveDatasets(nickname).catch(() => {
      if (generation === generationRef.current) {
        toast.warning("Previous local results could not be cleared.")
      }
    })
    void loadMode(nickname, 4, generation)
  }

  function handleTabChange(value: string | number) {
    const button = Number(value)
    if (!isVArchiveButton(button)) {
      return
    }

    setActiveButton(button)
    if (submittedUsername.length > 0 && modeStates[button].status === "idle") {
      void loadMode(submittedUsername, button, generationRef.current)
    }
  }

  const initialLoading = !tabsEnabled && modeStates[4].status === "loading"

  return (
    <section
      className="flex h-full min-h-0 w-full flex-col gap-3 p-4"
      aria-label="V-ARCHIVE top accomplishments"
    >
      <form className="flex gap-2" onSubmit={handleSubmit}>
        <Input
          aria-label="V-ARCHIVE username"
          autoComplete="off"
          placeholder="V-ARCHIVE username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Search"
          aria-busy={initialLoading}
        >
          {initialLoading ? <Loader2 className="animate-spin" /> : <Search />}
        </Button>
      </form>

      <Tabs
        value={String(activeButton)}
        onValueChange={handleTabChange}
        className="min-h-0 flex-1"
      >
        <fieldset className="contents" disabled={!tabsEnabled}>
          <TabsList className="grid w-full grid-cols-4">
            {V_ARCHIVE_BUTTONS.map((button) => (
              <TabsTrigger
                key={button}
                value={String(button)}
                disabled={!tabsEnabled}
              >
                {button}B
              </TabsTrigger>
            ))}
          </TabsList>
        </fieldset>

        {V_ARCHIVE_BUTTONS.map((button) => (
          <TabsContent
            key={button}
            value={String(button)}
            className="min-h-0 overflow-y-auto"
          >
            <Results
              button={button}
              hasSearch={submittedUsername.length > 0}
              state={modeStates[button]}
            />
          </TabsContent>
        ))}
      </Tabs>

      <Toaster position="top-center" richColors closeButton />
    </section>
  )
}
