export const V_ARCHIVE_BUTTONS = [4, 5, 6, 8] as const

export type VArchiveButton = (typeof V_ARCHIVE_BUTTONS)[number]
export type VArchivePattern = "NM" | "HD" | "MX" | "SC"

export type VArchiveRecord = {
  title: number
  name: string
  dlcCode: string
  pattern: VArchivePattern
  level: number
  floor: number | null
  floorName: string | null
  newTab: boolean
  maxRating: number
  score: number
  maxCombo: boolean
  rating: number | null
  djpower: number
  maxDjpower: number | null
  updatedAt: string | null
}

export type VArchiveResponse = {
  success: true
  nickname: string
  button: VArchiveButton
  count: number
  records: VArchiveRecord[]
}

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

type FetchOptions = {
  signal?: AbortSignal
  fetcher?: FetchLike
}

const PATTERNS: VArchivePattern[] = ["NM", "HD", "MX", "SC"]
const API_ROOT = "https://v-archive.net/api/v2/archive"
const PROXY_URL = "https://cloudflare-cors-anywhere.sean9892.workers.dev"

export class VArchiveApiError extends Error {
  readonly status: number
  readonly code: number | null

  constructor(message: string, status: number, code: number | null = null) {
    super(message)
    this.name = "VArchiveApiError"
    this.status = status
    this.code = code
  }
}

export function isVArchiveButton(
  value: number
): value is VArchiveButton {
  return V_ARCHIVE_BUTTONS.includes(value as VArchiveButton)
}

export function normalizeVArchiveUsername(username: string) {
  return username.trim().toLowerCase()
}

export function buildVArchiveUrl(
  nickname: string,
  button: VArchiveButton
) {
  const path =
    API_ROOT +
    "/" +
    encodeURIComponent(nickname.trim()) +
    "/button/" +
    button
  const url = new URL(path)
  url.searchParams.set("sort", "rating")
  url.searchParams.set("order", "desc")
  return PROXY_URL +"/?"+url.toString()
}

export function sortVArchiveRecords(records: VArchiveRecord[]) {
  return [...records].sort((left, right) => {
    if (left.rating === null && right.rating === null) {
      return 0
    }
    if (left.rating === null) {
      return 1
    }
    if (right.rating === null) {
      return -1
    }
    return right.rating - left.rating
  })
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number"
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string"
}

function isPattern(value: unknown): value is VArchivePattern {
  return (
    typeof value === "string" &&
    PATTERNS.includes(value as VArchivePattern)
  )
}

function isRecord(value: unknown): value is VArchiveRecord {
  if (!isObject(value)) {
    return false
  }

  return (
    typeof value.title === "number" &&
    typeof value.name === "string" &&
    typeof value.dlcCode === "string" &&
    isPattern(value.pattern) &&
    typeof value.level === "number" &&
    isNullableNumber(value.floor) &&
    isNullableString(value.floorName) &&
    typeof value.newTab === "boolean" &&
    typeof value.maxRating === "number" &&
    typeof value.score === "number" &&
    typeof value.maxCombo === "boolean" &&
    isNullableNumber(value.rating) &&
    typeof value.djpower === "number" &&
    isNullableNumber(value.maxDjpower) &&
    isNullableString(value.updatedAt)
  )
}

function parseSuccess(
  payload: unknown,
  requestedButton: VArchiveButton
): VArchiveResponse | null {
  if (
    !isObject(payload) ||
    payload.success !== true ||
    typeof payload.nickname !== "string" ||
    payload.button !== requestedButton ||
    typeof payload.count !== "number" ||
    !Array.isArray(payload.records) ||
    !payload.records.every(isRecord)
  ) {
    return null
  }

  return {
    success: true,
    nickname: payload.nickname,
    button: requestedButton,
    count: payload.count,
    records: sortVArchiveRecords(payload.records),
  }
}

function errorCode(payload: unknown) {
  if (isObject(payload) && typeof payload.errorCode === "number") {
    return payload.errorCode
  }
  return null
}

export async function fetchVArchiveRecords(
  nickname: string,
  button: VArchiveButton,
  options: FetchOptions = {}
): Promise<VArchiveResponse> {
  const fetcher = options.fetcher ?? globalThis.fetch
  const response = await fetcher(buildVArchiveUrl(nickname, button), {
    headers: { "Content-Type": "application/json" },
    signal: options.signal,
  })

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new VArchiveApiError(
      "V-ARCHIVE returned an invalid response.",
      response.status
    )
  }

  const code = errorCode(payload)
  if (response.status === 404 && code === 101) {
    throw new VArchiveApiError(
      "V-ARCHIVE user not found.",
      response.status,
      code
    )
  }

  if (!response.ok) {
    throw new VArchiveApiError(
      "Could not load V-ARCHIVE records.",
      response.status,
      code
    )
  }

  const parsed = parseSuccess(payload, button)
  if (parsed === null) {
    throw new VArchiveApiError(
      "V-ARCHIVE returned an invalid response.",
      response.status,
      code
    )
  }

  return parsed
}
