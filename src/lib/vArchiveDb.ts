import {
  normalizeVArchiveUsername,
  type VArchiveButton,
  type VArchiveRecord,
  type VArchiveResponse,
} from "@/lib/vArchive"

export type StoredVArchiveDataset = {
  id: string
  usernameKey: string
  nickname: string
  button: VArchiveButton
  fetchedAt: string
  records: VArchiveRecord[]
}

const DATABASE_NAME = "malmijal"
const DATABASE_VERSION = 1
const STORE_NAME = "vArchiveResults"
const USERNAME_INDEX = "usernameKey"

let mutationQueue: Promise<void> = Promise.resolve()

function datasetId(usernameKey: string, button: VArchiveButton) {
  return usernameKey + ":" + button
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed."))
  })
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed."))
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted."))
  })
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      const store = database.objectStoreNames.contains(STORE_NAME)
        ? request.transaction?.objectStore(STORE_NAME)
        : database.createObjectStore(STORE_NAME, { keyPath: "id" })

      if (store && !store.indexNames.contains(USERNAME_INDEX)) {
        store.createIndex(USERNAME_INDEX, USERNAME_INDEX)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open IndexedDB."))
  })
}

function enqueueMutation(operation: () => Promise<void>) {
  const result = mutationQueue.then(operation, operation)
  mutationQueue = result.catch(() => undefined)
  return result
}

export function saveVArchiveDataset(
  username: string,
  response: VArchiveResponse,
  fetchedAt = new Date().toISOString()
) {
  return enqueueMutation(async () => {
    const database = await openDatabase()
    try {
      const transaction = database.transaction(STORE_NAME, "readwrite")
      const done = transactionDone(transaction)
      const usernameKey = normalizeVArchiveUsername(username)
      const dataset: StoredVArchiveDataset = {
        id: datasetId(usernameKey, response.button),
        usernameKey,
        nickname: response.nickname,
        button: response.button,
        fetchedAt,
        records: response.records,
      }

      transaction.objectStore(STORE_NAME).put(dataset)
      await done
    } finally {
      database.close()
    }
  })
}

export async function getVArchiveDataset(
  username: string,
  button: VArchiveButton
): Promise<StoredVArchiveDataset | null> {
  const database = await openDatabase()
  try {
    const transaction = database.transaction(STORE_NAME, "readonly")
    const done = transactionDone(transaction)
    const usernameKey = normalizeVArchiveUsername(username)
    const request = transaction
      .objectStore(STORE_NAME)
      .get(datasetId(usernameKey, button))
    const result = await requestResult<StoredVArchiveDataset | undefined>(
      request
    )
    await done
    return result ?? null
  } finally {
    database.close()
  }
}

export function clearVArchiveDatasets(username: string) {
  return enqueueMutation(async () => {
    const database = await openDatabase()
    try {
      const transaction = database.transaction(STORE_NAME, "readwrite")
      const done = transactionDone(transaction)
      const index = transaction.objectStore(STORE_NAME).index(USERNAME_INDEX)
      const range = IDBKeyRange.only(normalizeVArchiveUsername(username))

      await new Promise<void>((resolve, reject) => {
        const request = index.openCursor(range)
        request.onerror = () =>
          reject(request.error ?? new Error("Could not clear IndexedDB data."))
        request.onsuccess = () => {
          const cursor = request.result
          if (cursor === null) {
            resolve()
            return
          }
          cursor.delete()
          cursor.continue()
        }
      })

      await done
    } finally {
      database.close()
    }
  })
}
