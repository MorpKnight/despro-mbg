import NetInfo from '@react-native-community/netinfo';
import { api } from './api';
import { bumpTries, getQueuedData, queueDataForSync, removeSyncedItem } from './offlineQueue';

let isSyncing = false;

// Basic offline-to-online synchronization logic
export async function syncOfflineData() {
  if (isSyncing) {
    console.log('[sync] already running, skipping');
    return false;
  }

  isSyncing = true;
  try {
    console.log('[sync] start');
    const queued = await getQueuedData();
    if (!queued.length) {
      console.log('[sync] no items to sync');
      return true;
    }

    let successCount = 0;
    for (const item of queued) {
      try {
        // Send item to a generic sync endpoint; backend can route by item.type
        await api('/sync', { method: 'POST', body: item as any });
        await removeSyncedItem(item.id);
        successCount += 1;
        console.log('[sync] synced item', item.id, item.type);
      } catch (err) {
        // Leave item in queue and bump attempt count
        await bumpTries(item.id);
        console.log('[sync] failed item', item.id, item.type, err);
      }
    }

    console.log('[sync] done. success:', successCount, 'total:', queued.length);
    return successCount === queued.length;
  } finally {
    isSyncing = false;
  }
}

export function isSyncInProgress() {
  return isSyncing;
}

// Helper: try to submit now if online, else enqueue
export async function submitOrQueue<T>(
  type: string,
  payload: T,
  sender: () => Promise<unknown>,
  id?: string
): Promise<{ queued: boolean }> {
  const state = await NetInfo.fetch();
  const online = (state.isInternetReachable ?? state.isConnected ?? false) as boolean;
  if (!online) {
    console.log('[sync] offline, queueing', type);
    await queueDataForSync({ type, payload, id });
    return { queued: true };
  }
  try {
    await sender();
    console.log('[sync] sent immediately', type);
    return { queued: false };
  } catch (err) {
    console.log('[sync] send failed, queueing', type, err);
    await queueDataForSync({ type, payload, id });
    return { queued: true };
  }
}
