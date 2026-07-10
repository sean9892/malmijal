import { describe, expect, test, vi } from "vitest"

import {
  VArchiveApiError,
  buildVArchiveUrl,
  fetchVArchiveRecords,
  normalizeVArchiveUsername,
  sortVArchiveRecords,
  type VArchiveRecord,
} from "@/lib/vArchive"

function record(
  name: string,
  rating: number | null
): VArchiveRecord {
  return {
    title: name.length,
    name,
    dlcCode: "R",
    pattern: "HD",
    level: 10,
    floor: rating === null ? null : 100,
    floorName: rating === null ? null : "10.0",
    newTab: false,
    maxRating: 2,
    score: 99.5,
    maxCombo: true,
    rating,
    djpower: 50,
    maxDjpower: 2,
    updatedAt: "2026-07-10T00:00:00.000Z",
  }
}

describe("V-ARCHIVE client", () => {
  test("normalizes storage keys and encodes nickname paths", () => {
    expect(normalizeVArchiveUsername("  DJ Max  ")).toBe("dj max")
    expect(buildVArchiveUrl("DJ Max/테스트", 4)).toBe(
      "https://v-archive.net/api/v2/archive/DJ%20Max%2F%ED%85%8C%EC%8A%A4%ED%8A%B8/button/4?sort=rating&order=desc"
    )
  })

  test("sorts ratings descending, keeps null last, and preserves ties", () => {
    const source = [
      record("null", null),
      record("first tie", 1.5),
      record("highest", 2.1),
      record("second tie", 1.5),
    ]

    const sorted = sortVArchiveRecords(source)

    expect(sorted.map((entry) => entry.name)).toEqual([
      "highest",
      "first tie",
      "second tie",
      "null",
    ])
    expect(source[0]?.name).toBe("null")
  })

  test("validates and returns a sorted successful response", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          userNo: 7,
          nickname: "DJ Max",
          button: 4,
          count: 2,
          records: [record("lower", 1.1), record("higher", 2.2)],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    )

    const response = await fetchVArchiveRecords("DJ Max", 4, {
      fetcher,
    })

    expect(fetcher).toHaveBeenCalledWith(
      buildVArchiveUrl("DJ Max", 4),
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
        signal: undefined,
      })
    )
    expect(response.records.map((entry) => entry.name)).toEqual([
      "higher",
      "lower",
    ])
  })

  test("maps user-not-found and malformed success responses", async () => {
    const missingUser = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          errorCode: 101,
          message: "유저를 찾을 수 없습니다",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      )
    )

    await expect(
      fetchVArchiveRecords("missing", 4, { fetcher: missingUser })
    ).rejects.toMatchObject({
      message: "V-ARCHIVE user not found.",
      status: 404,
      code: 101,
    })

    const malformed = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          userNo: 7,
          nickname: "DJ Max",
          button: 5,
          count: 0,
          records: [],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    )

    await expect(
      fetchVArchiveRecords("DJ Max", 4, { fetcher: malformed })
    ).rejects.toBeInstanceOf(VArchiveApiError)
  })
})
