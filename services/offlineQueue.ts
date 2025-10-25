import { storage } from './storage';

export const OFFLINE_QUEUE_KEY = 'offlineQueue';

export type OfflineQueueItem = {
  id: string;
  type: string; // e.g., 'attendance', 'feedback', 'emergency-update'
  payload: any;
  createdAt: string; // ISO string
  tries?: number; // number of send attempts
};

async function readQueue(): Promise<OfflineQueueItem[]> {
  const arr = (await storage.get<OfflineQueueItem[]>(OFFLINE_QUEUE_KEY)) || [];
  return Array.isArray(arr) ? arr : [];
}

async function writeQueue(items: OfflineQueueItem[]): Promise<void> {
  await storage.set(OFFLINE_QUEUE_KEY, items);
}

export async function queueDataForSync(item: { type: string; payload: any; id?: string }): Promise<OfflineQueueItem> {
  const id = item.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const entry: OfflineQueueItem = {
    id,
    type: item.type,
    payload: item.payload,
    createdAt: new Date().toISOString(),
    tries: 0,
  };
  const queue = await readQueue();
  queue.push(entry);
  await writeQueue(queue);
  console.log('[offlineQueue] queued item', { id: entry.id, type: entry.type });
  return entry;
}

export async function getQueuedData(): Promise<OfflineQueueItem[]> {
  const items = await readQueue();
  console.log('[offlineQueue] getQueuedData -> count', items.length);
  return items;
}

export async function removeSyncedItem(id: string): Promise<void> {
  const queue = await readQueue();
  const next = queue.filter(q => q.id !== id);
  await writeQueue(next);
  console.log('[offlineQueue] removed item', id);
}

export async function bumpTries(id: string): Promise<void> {
  const queue = await readQueue();
  const idx = queue.findIndex(q => q.id === id);
  if (idx !== -1) {
    const item = queue[idx];
    queue[idx] = { ...item, tries: (item.tries || 0) + 1 };
    await writeQueue(queue);
  }
}
