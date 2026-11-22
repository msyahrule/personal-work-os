
/* =====================================
   PERSONAL WORK OS
   STEP 6 - INDEXEDDB INITIALIZATION
===================================== */

const DB_NAME = "PersonalWorkOS_DB";
const DB_VERSION = 2;

let db;

// Initialize database
export function initDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // Create database structure
        request.onupgradeneeded = function (event) {

            const database = event.target.result;

            const stores = [
                "tasks",
                "projects",
                "notes",
                "goals",
                "habits",
                "habit_logs",
                "learning",
                "journal",
                "transactions",
                "business_ideas",
                "settings",
                "activity_logs",
                "sync_tombstones"
            ];

            stores.forEach(storeName => {

                if (!database.objectStoreNames.contains(storeName)) {

                    database.createObjectStore(storeName, {
                        keyPath: "id"
                    });

                }

            });

        };

        // Database successfully opened
        request.onsuccess = function (event) {

            db = event.target.result;

            console.log("Database berhasil dibuat!");
            console.log("Database Name:", DB_NAME);
            console.log("Database Version:", DB_VERSION);

            resolve(db);

        };

        // Database error
        request.onerror = function () {

            console.error("Gagal membuka database:", request.error);

            reject(request.error);

        };

    });

}
