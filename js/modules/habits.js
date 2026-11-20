
/* =====================================
   PERSONAL WORK OS
   HABIT TRACKER MODULE
===================================== */

import {
    createData,
    getAllData,
    getDataById,
    updateData,
    deleteData
} from "../services/storage.js";

const HABIT_STORE = "habits";
const LOG_STORE = "habit_logs";

export const PRAYER_ITEMS = [
    { id: "subuh", name: "Subuh" },
    { id: "zuhur", name: "Zuhur" },
    { id: "asar", name: "Asar" },
    { id: "magrib", name: "Magrib" },
    { id: "isya", name: "Isya" }
];

// =====================================
// DATE HELPERS
// =====================================

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function addDays(dateString, amount) {
    const [year, month, day] = dateString.split("-").map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() + amount);

    return date.toISOString().slice(0, 10);
}

function getDayOfWeek(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

// =====================================
// HABIT CRUD
// =====================================

export async function createHabit(data) {
    if (!data || !data.name?.trim()) {
        throw new Error("Nama kebiasaan wajib diisi.");
    }

    return createData(HABIT_STORE, {
        name: data.name.trim(),
        description: data.description || "",
        category: data.category || "Personal",
        type: "habit",
        scheduledDays: data.scheduledDays || [0, 1, 2, 3, 4, 5, 6],
        startDate: data.startDate || getLocalDateString(),
        isActive: true,
        isArchived: false
    });
}

export async function getHabits() {
    const habits = await getAllData(HABIT_STORE);

    return habits.filter(habit =>
        habit.type !== "prayer" &&
        habit.isActive !== false &&
        habit.isArchived !== true
    );
}

export async function getAllHabits() {
    return getAllData(HABIT_STORE);
}

export async function getHabit(id) {
    return getDataById(HABIT_STORE, id);
}

export async function editHabit(id, changes) {
    if (changes.name !== undefined && !changes.name.trim()) {
        throw new Error("Nama kebiasaan tidak boleh kosong.");
    }

    return updateData(HABIT_STORE, id, changes);
}

export async function archiveHabit(id) {
    return updateData(HABIT_STORE, id, {
        isArchived: true,
        isActive: false
    });
}

// Permanent delete also removes all associated logs.
export async function removeHabit(id) {
    const logs = await getHabitLogs(id);

    for (const log of logs) {
        await deleteData(LOG_STORE, log.id);
    }

    await deleteData(HABIT_STORE, id);

    return true;
}

// =====================================
// PRAYER TRACKER
// =====================================

export async function getOrCreatePrayerHabit() {
    const habits = await getAllData(HABIT_STORE);

    let prayerHabit = habits.find(
        habit => habit.type === "prayer"
    );

    if (prayerHabit) {
        return prayerHabit;
    }

    prayerHabit = await createData(HABIT_STORE, {
        name: "Salat Lima Waktu",
        description: "Checklist salat wajib harian.",
        category: "Ibadah",
        type: "prayer",
        items: PRAYER_ITEMS,
        scheduledDays: [0, 1, 2, 3, 4, 5, 6],
        startDate: getLocalDateString(),
        isActive: true,
        isArchived: false
    });

    return prayerHabit;
}

// =====================================
// DAILY LOGS
// =====================================

export async function getHabitLogs(habitId) {
    const logs = await getAllData(LOG_STORE);

    return logs.filter(log => log.habitId === habitId);
}

export async function getDailyHabitLogs(habitId, date = getLocalDateString()) {
    const logs = await getHabitLogs(habitId);

    return logs.filter(log => log.date === date);
}

// One record per habit, date, and item.
// For ordinary habits, itemKey is "done".
// For prayer, itemKey is the prayer ID.
export async function setHabitLog(
    habitId,
    date,
    itemKey = "done",
    completed = true
) {
    const habit = await getHabit(habitId);

    if (!habit) {
        throw new Error("Data kebiasaan tidak ditemukan.");
    }

    const logs = await getHabitLogs(habitId);

    const existingLog = logs.find(log =>
        log.date === date &&
        log.itemKey === itemKey
    );

    if (existingLog) {
        return updateData(LOG_STORE, existingLog.id, {
            completed: Boolean(completed)
        });
    }

    return createData(LOG_STORE, {
        habitId,
        date,
        itemKey,
        completed: Boolean(completed)
    });
}

// Convenience function for the five daily prayers.
export async function setPrayerLog(
    date,
    prayerId,
    completed = true
) {
    const prayerHabit = await getOrCreatePrayerHabit();

    const validPrayer = PRAYER_ITEMS.some(
        prayer => prayer.id === prayerId
    );

    if (!validPrayer) {
        throw new Error("Waktu salat tidak valid.");
    }

    return setHabitLog(
        prayerHabit.id,
        date,
        prayerId,
        completed
    );
}

export async function getPrayerChecklist(date = getLocalDateString()) {
    const prayerHabit = await getOrCreatePrayerHabit();
    const logs = await getDailyHabitLogs(prayerHabit.id, date);

    return PRAYER_ITEMS.map(prayer => {
        const log = logs.find(item =>
            item.itemKey === prayer.id
        );

        return {
            ...prayer,
            completed: log?.completed === true
        };
    });
}

// =====================================
// HABIT COMPLETION
// =====================================

async function isHabitCompleted(habit, date, logs) {
    const dayLogs = logs.filter(log =>
        log.date === date && log.completed === true
    );

    if (habit.type === "prayer") {
        return PRAYER_ITEMS.every(prayer =>
            dayLogs.some(log => log.itemKey === prayer.id)
        );
    }

    return dayLogs.some(log => log.itemKey === "done");
}

export async function getHabitStats(habitId) {
    const habit = await getHabit(habitId);

    if (!habit) {
        throw new Error("Data kebiasaan tidak ditemukan.");
    }

    const logs = await getHabitLogs(habitId);
    const today = getLocalDateString();

    const completedDates = [];

    for (const log of logs) {
        if (log.completed && !completedDates.includes(log.date)) {
            completedDates.push(log.date);
        }
    }

    let totalCompleted = 0;

    for (const date of completedDates) {
        const dayLogs = logs.filter(log =>
            log.date === date && log.completed
        );

        if (habit.type === "prayer") {
            if (PRAYER_ITEMS.every(prayer =>
                dayLogs.some(log => log.itemKey === prayer.id)
            )) {
                totalCompleted++;
            }
        } else if (dayLogs.some(log => log.itemKey === "done")) {
            totalCompleted++;
        }
    }

    const scheduledDays = habit.scheduledDays || [
        0, 1, 2, 3, 4, 5, 6
    ];

    let streak = 0;
    let currentDate = today;

    // An unchecked current day is not considered missed
    // until the day has ended.
    const todayCompleted = await isHabitCompleted(
        habit,
        today,
        logs
    );

    if (!todayCompleted) {
        currentDate = addDays(today, -1);
    }

    // Count consecutive scheduled occurrences.
    for (let i = 0; i < 3660; i++) {
        if (currentDate < habit.startDate) {
            break;
        }

        const day = getDayOfWeek(currentDate);

        if (scheduledDays.includes(day)) {
            const completed = await isHabitCompleted(
                habit,
                currentDate,
                logs
            );

            if (!completed) {
                break;
            }

            streak++;
        }

        currentDate = addDays(currentDate, -1);
    }

    return {
        totalCompleted,
        currentStreak: streak,
        completedDates,
        todayCompleted
    };
}

// =====================================
// HISTORY
// =====================================

export async function getHabitHistory(habitId) {
    const logs = await getHabitLogs(habitId);

    return logs.sort((a, b) =>
        b.date.localeCompare(a.date)
    );
}

export async function getPrayerHistory() {
    const prayerHabit = await getOrCreatePrayerHabit();

    const logs = await getHabitLogs(prayerHabit.id);

    const dates = [...new Set(
        logs.map(log => log.date)
    )].sort((a, b) => b.localeCompare(a));

    return dates.map(date => {
        const dayLogs = logs.filter(log =>
            log.date === date
        );

        const completed = PRAYER_ITEMS.filter(prayer =>
            dayLogs.some(log =>
                log.itemKey === prayer.id &&
                log.completed === true
            )
        );

        return {
            date,
            completed,
            completedCount: completed.length,
            totalCount: PRAYER_ITEMS.length,
            isComplete: completed.length === PRAYER_ITEMS.length
        };
    });
}
