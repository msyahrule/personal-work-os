import { supabase } from "./supabase-client.js";
import { initDatabase } from "./db.js";

const DATA_STORES = [
  "tasks", "projects", "notes", "goals", "habits", "habit_logs",
  "learning", "journal", "transactions", "business_ideas",
  "settings", "activity_logs"
];
const TOMBSTONE_STORE = "sync_tombstones";
let syncBusy = false;

function allFromStore(db, name) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(name, "readonly");
    const req = tx.objectStore(name).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
function putLocal(db, storeName, record) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
function deleteLocal(db, storeName, id) {
  if (!db.objectStoreNames.contains(storeName)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
const stamp = record => Date.parse(record?.updatedAt || record?.updated_at || record?.createdAt || 0) || 0;

async function readCloud(userId) {
  const { data, error } = await supabase.from("pwo_records")
    .select("module,record_id,payload,updated_at")
    .eq("user_id", userId);
  if (error) throw error;
  return data || [];
}
async function upsertCloud(userId, module, recordId, payload, updatedAt) {
  const row = {
    user_id: userId,
    module,
    record_id: String(recordId),
    payload,
    updated_at: updatedAt || new Date().toISOString()
  };
  const { error } = await supabase.from("pwo_records").upsert(row, {
    onConflict: "user_id,module,record_id"
  });
  if (error) throw error;
}

export async function syncAll() {
  if (!supabase || syncBusy || !navigator.onLine) return { skipped: true };
  syncBusy = true;
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const user = sessionData.session?.user;
    if (!user) return { skipped: true };

    const db = await initDatabase();
    const cloudRows = await readCloud(user.id);
    const cloudMap = new Map(cloudRows.map(row => [`${row.module}::${row.record_id}`, row]));
    let pulled = 0, pushed = 0;

    // Apply cloud deletion markers first.
    const localTombstones = await allFromStore(db, TOMBSTONE_STORE);
    const cloudTombstones = cloudRows.filter(row => row.module === "__tombstones");
    const tombstoneMap = new Map();
    for (const t of localTombstones) tombstoneMap.set(`${t.targetStore}::${t.targetId}`, t);
    for (const row of cloudTombstones) {
      const t = row.payload || {};
      if (t.targetStore && t.targetId) {
        tombstoneMap.set(`${t.targetStore}::${t.targetId}`, {
          id: `${t.targetStore}::${t.targetId}`,
          targetStore: t.targetStore,
          targetId: t.targetId,
          updatedAt: row.updated_at || t.updatedAt
        });
      }
    }
    for (const t of tombstoneMap.values()) {
      await deleteLocal(db, t.targetStore, t.targetId);
      const cloud = cloudMap.get(`__tombstones::${t.id}`);
      if (!cloud || stamp(t) > stamp(cloud)) {
        await upsertCloud(user.id, "__tombstones", t.id, t, t.updatedAt);
        pushed++;
      }
    }

    // Merge each application store by updatedAt. Newer timestamp wins.
    for (const storeName of DATA_STORES) {
      const localRecords = await allFromStore(db, storeName);
      const localMap = new Map(localRecords.map(record => [String(record.id), record]));
      const remoteRecords = cloudRows.filter(row => row.module === storeName);

      for (const row of remoteRecords) {
        const id = String(row.record_id);
        if (tombstoneMap.has(`${storeName}::${id}`)) continue;
        const local = localMap.get(id);
        if (!local || stamp(row.payload) > stamp(local)) {
          await putLocal(db, storeName, { ...row.payload, id: row.payload?.id ?? id });
          pulled++;
        }
      }

      for (const local of localRecords) {
        if (tombstoneMap.has(`${storeName}::${String(local.id)}`)) continue;
        const key = `${storeName}::${local.id}`;
        const cloud = cloudMap.get(key);
        if (!cloud || stamp(local) > stamp(cloud)) {
          await upsertCloud(user.id, storeName, local.id, local, local.updatedAt || local.createdAt);
          pushed++;
        }
      }
    }
    return { pulled, pushed };
  } finally {
    syncBusy = false;
  }
}

export function startCloudSync(onStatus = () => {}) {
  const run = async () => {
    if (!navigator.onLine) {
      onStatus("offline", "Offline — data tersimpan di perangkat");
      return;
    }
    onStatus("syncing", "Menyinkronkan...");
    try {
      const result = await syncAll();
      onStatus("ready", result?.skipped ? "Cloud belum aktif" : "Tersinkron");
    } catch (error) {
      console.error("PWO cloud sync:", error);
      onStatus("error", "Sync gagal — data lokal tetap aman");
    }
  };
  run();
  const interval = setInterval(run, 30000);
  window.addEventListener("online", run);
  window.addEventListener("focus", run);
  return () => {
    clearInterval(interval);
    window.removeEventListener("online", run);
    window.removeEventListener("focus", run);
  };
}
