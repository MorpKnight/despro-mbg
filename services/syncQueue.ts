import { api } from './api';
import { getDatabase, type OfflineQueueRow } from './database';

let processingPromise: Promise<void> | null = null;

function parseMaybeJson<T = any>(value: string | null): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch (err) {
    console.warn('[syncQueue] failed to parse stored payload', err);
    return undefined;
  }
}

function extractStatusCode(error: unknown): number | null {
  const message = error instanceof Error ? error.message : '';
  if (!message) return null;

  const apiMatch = message.match(/API\s(\d{3})/);
  if (apiMatch) {
    return Number(apiMatch[1]);
  }
  if (message.startsWith('Unauthorized')) {
    return 401;
  }
  return null;
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('network request failed') || msg.includes('gagal terhubung');
  }
  return false;
}

async function markFailed(id: number) {
  const db = await getDatabase();
  await db.runAsync(`UPDATE offline_queue SET status = 'FAILED' WHERE id = ?`, id);
}

async function removeItem(id: number) {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM offline_queue WHERE id = ?`, id);
}

export async function enqueueRequest(
  endpoint: string,
  method: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<void> {
  const db = await getDatabase();
  const payload = body == null ? null : JSON.stringify(body);
  const headerJson = headers ? JSON.stringify(headers) : null;
  await db.runAsync(
    `INSERT INTO offline_queue (endpoint, method, body, headers, status, created_at)
     VALUES (?, ?, ?, ?, 'PENDING', ?)`,
    endpoint,
    method.toUpperCase(),
    payload,
    headerJson,
    Date.now(),
  );
}

export async function processQueue(): Promise<void> {
  if (processingPromise) {
    return processingPromise;
  }
  processingPromise = (async () => {
    const db = await getDatabase();
    const pending = await db.getAllAsync<OfflineQueueRow>(
      `SELECT * FROM offline_queue WHERE status = 'PENDING' ORDER BY created_at ASC`,
    );

    for (const item of pending) {
      try {
        const parsedBody = parseMaybeJson(item.body);
        const parsedHeaders = parseMaybeJson<Record<string, string>>(item.headers);
        await api(item.endpoint, {
          method: item.method,
          body: parsedBody,
          headers: parsedHeaders,
        });
        await removeItem(item.id);
      } catch (err) {
        const status = extractStatusCode(err);
        if (status && status >= 400 && status < 500) {
          console.warn('[syncQueue] dropping item due to client error', status, err);
          await markFailed(item.id);
          continue;
        }

        if (isNetworkError(err)) {
          console.log('[syncQueue] network error, stopping queue processing');
          break;
        }

        console.warn('[syncQueue] server error, will retry later', err);
        // Leave as pending for a future retry cycle.
      }
    }
  })()
    .catch((err) => {
      console.warn('[syncQueue] unexpected failure', err);
    })
    .finally(() => {
      processingPromise = null;
    });

  return processingPromise;
}
