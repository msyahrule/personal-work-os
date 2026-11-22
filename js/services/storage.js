
/* =====================================
   PERSONAL WORK OS
   STEP 8.2 - STORAGE SERVICE
===================================== */

import { initDatabase } from "../db.js";

// Cache database connection
let databasePromise = null;

async function getDatabase() {

    if (!databasePromise) {
        databasePromise = initDatabase();
    }

    return databasePromise;
}

// Validate object store
async function validateStore(storeName) {

    const database = await getDatabase();

    if (!database.objectStoreNames.contains(storeName)) {
        throw new Error(`Object store "${storeName}" tidak ditemukan.`);
    }

    return database;
}

// CREATE - Add new data
export async function createData(storeName, data) {

    if (!data || typeof data !== "object") {
        throw new Error("Data tidak valid.");
    }

    const database = await validateStore(storeName);

    const record = {
        ...data,
        id: data.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {

        const transaction = database.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);

        store.add(record);

        transaction.oncomplete = () => resolve(record);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);

    });

}

// READ - Get all data
export async function getAllData(storeName) {

    const database = await validateStore(storeName);

    return new Promise((resolve, reject) => {

        const transaction = database.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);

    });

}

// READ - Get data by ID
export async function getDataById(storeName, id) {

    const database = await validateStore(storeName);

    return new Promise((resolve, reject) => {

        const transaction = database.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);

    });

}

// UPDATE - Update existing data
export async function updateData(storeName, id, changes) {

    const database = await validateStore(storeName);

    return new Promise((resolve, reject) => {

        const transaction = database.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        let updatedRecord;

        request.onsuccess = () => {

            if (!request.result) {
                transaction.abort();
                return;
            }

            updatedRecord = {
                ...request.result,
                ...changes,
                id,
                updatedAt: new Date().toISOString()
            };

            store.put(updatedRecord);

        };

        transaction.oncomplete = () => resolve(updatedRecord);

        transaction.onerror = () => reject(
            transaction.error || new Error("Gagal memperbarui data.")
        );

        transaction.onabort = () => reject(
            transaction.error || new Error("Data tidak ditemukan.")
        );

    });

}

// DELETE - Delete data by ID and preserve a cloud tombstone.
export async function deleteData(storeName, id) {
    const database = await validateStore(storeName);
    return new Promise((resolve, reject) => {
        const stores = storeName === "sync_tombstones"
            ? [storeName]
            : [storeName, "sync_tombstones"];
        const transaction = database.transaction(stores, "readwrite");
        transaction.objectStore(storeName).delete(id);

        if (storeName !== "sync_tombstones") {
            transaction.objectStore("sync_tombstones").put({
                id: `${storeName}::${String(id)}`,
                targetStore: storeName,
                targetId: id,
                updatedAt: new Date().toISOString()
            });
        }

        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
    });
}
