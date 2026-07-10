import { beforeEach, describe, expect, test } from "vitest"

import {
  clearVArchiveDatasets,
  getVArchiveDataset,
  saveVArchiveDataset,
} from "@/lib/vArchiveDb"
import type {
  VArchiveButton,
  VArchiveRecord,
  VArchiveResponse,
} from "@/lib/vArchive"

function response(
  nickname: string,
  button: VArchiveButton,
  song: string
): VArchiveResponse {
  const record: VArchiveRecord = {
    title: song.length,
    name: song,
    dlcCode: "R",
    pattern: "HD",
    level: 10,
    floor: 100,
    floorName: "10.0",
    newTab: false,
    maxRating: 2,
    score: 99.5,
    maxCombo: true,
    rating: 1.5,
    djpower: 50,
    maxDjpower: 2,
    updatedAt: "2026-07-10T00:00:00.000Z",
  }

  return {
    success: true,
    nickname,
    button,
    count: 1,
    records: [record],
  }
}

describe("V-ARCHIVE IndexedDB storage", () => {
  beforeEach(async () => {
    await clearVArchiveDatasets("Alice")
    await clearVArchiveDatasets("Bob")
  })

  test("stores and replaces one dataset per normalized username and mode", async () => {
    await saveVArchiveDataset(
      " Alice ",
      response("Alice", 4, "First"),
      "2026-07-10T01:00:00.000Z"
    )
    await saveVArchiveDataset(
      "alice",
      response("Alice", 4, "Replacement"),
      "2026-07-10T02:00:00.000Z"
    )

    const stored = await getVArchiveDataset("ALICE", 4)

    expect(stored).toMatchObject({
      usernameKey: "alice",
      nickname: "Alice",
      button: 4,
      fetchedAt: "2026-07-10T02:00:00.000Z",
    })
    expect(stored?.records[0]?.name).toBe("Replacement")
  })

  test("clears every mode for one username and preserves other users", async () => {
    await saveVArchiveDataset("Alice", response("Alice", 4, "A4"))
    await saveVArchiveDataset("Alice", response("Alice", 5, "A5"))
    await saveVArchiveDataset("Bob", response("Bob", 4, "B4"))

    await clearVArchiveDatasets("ALICE")

    expect(await getVArchiveDataset("Alice", 4)).toBeNull()
    expect(await getVArchiveDataset("Alice", 5)).toBeNull()
    expect(await getVArchiveDataset("Bob", 4)).toMatchObject({
      nickname: "Bob",
    })
  })
})
