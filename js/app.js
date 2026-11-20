
/* =========================================
   PERSONAL WORK OS
   STEP 10 - TASKS + HABIT TRACKER
========================================= */

import { initDatabase } from "./db.js";

import {
    createTask,
    getTasks,
    getTask,
    editTask,
    removeTask
} from "./modules/tasks.js";

import {
    createHabit,
    getHabits,
    getAllHabits,
    getHabit,
    editHabit,
    archiveHabit,
    removeHabit,
    getOrCreatePrayerHabit,
    getDailyHabitLogs,
    getHabitLogs,
    getHabitStats,
    setHabitLog,
    setPrayerLog,
    getPrayerChecklist,
    getPrayerHistory,
    PRAYER_ITEMS
} from "./modules/habits.js";

/* =========================================
   APP CONFIGURATION
========================================= */

const APP_CONFIG = {
    name: "Personal Work OS",
    version: "1.1.0"
};

let editingTaskId = null;
let editingHabitId = null;

let allTasks = [];
let allHabits = [];
let archivedHabits = [];

/* =========================================
   DOM ELEMENTS - NAVIGATION
========================================= */

const navigation = document.getElementById("main-navigation");
const pageTitle = document.getElementById("page-title");

const tasksPage = document.getElementById("tasks-page");
const habitsPage = document.getElementById("habits-page");

/* =========================================
   DOM ELEMENTS - TASKS
========================================= */

const taskForm = document.getElementById("task-form");
const taskList = document.getElementById("task-list");

const titleInput = document.getElementById("task-title");
const descriptionInput = document.getElementById("task-description");
const priorityInput = document.getElementById("task-priority");
const statusInput = document.getElementById("task-status");
const deadlineInput = document.getElementById("task-deadline");

const saveButton = document.getElementById("save-task-btn");

const searchInput = document.getElementById("task-search");
const statusFilter = document.getElementById("filter-status");
const priorityFilter = document.getElementById("filter-priority");
const resetFilterButton = document.getElementById("reset-filters-btn");
const taskCount = document.getElementById("task-count");

/* TASK SUMMARY */

const summaryTotal = document.getElementById("summary-total");
const summaryPending = document.getElementById("summary-pending");
const summaryProgress = document.getElementById("summary-progress");
const summaryCompleted = document.getElementById("summary-completed");

/* DEADLINE SUMMARY */

const deadlineOverdue = document.getElementById("deadline-overdue");
const deadlineToday = document.getElementById("deadline-today");
const deadlineUpcoming = document.getElementById("deadline-upcoming");

/* =========================================
   DOM ELEMENTS - HABITS
========================================= */

const habitForm = document.getElementById("habit-form");
const habitNameInput = document.getElementById("habit-name");
const habitDescriptionInput = document.getElementById("habit-description");
const habitCategoryInput = document.getElementById("habit-category");

const saveHabitButton = document.getElementById("save-habit-btn");
const cancelHabitButton = document.getElementById("cancel-habit-edit-btn");

const habitList = document.getElementById("habit-list");
const archivedHabitList = document.getElementById("archived-habit-list");

const prayerChecklist = document.getElementById("prayer-checklist");
const prayerProgressText = document.getElementById("prayer-progress-text");
const prayerProgressBar = document.getElementById("prayer-progress-bar");

const habitSummaryTotal = document.getElementById("habit-summary-total");
const habitSummaryCompleted = document.getElementById("habit-summary-completed");
const habitSummaryPending = document.getElementById("habit-summary-pending");
const habitSummaryStreak = document.getElementById("habit-summary-streak");

const historyDateInput = document.getElementById("habit-history-date");
const historyTypeInput = document.getElementById("habit-history-type");

const historyCalendar = document.getElementById("habit-history-calendar");
const historyList = document.getElementById("habit-history-list");

/* =========================================
   LABELS
========================================= */

const PRIORITY_LABELS = {
    high: "Prioritas Tinggi",
    medium: "Prioritas Sedang",
    low: "Prioritas Rendah"
};

const STATUS_LABELS = {
    pending: "Belum Dimulai",
    in_progress: "Sedang Dikerjakan",
    completed: "Selesai"
};

const DAY_NAMES = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu"
];

/* =========================================
   DATE HELPERS
========================================= */

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    if (!dateString) return "-";

    const [year, month, day] = dateString.split("-");

    return `${day}/${month}/${year}`;
}

function getDateDay(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(year, month - 1, day).getDay();
}

function getDateLabel(dateString) {
    const day = getDateDay(dateString);
    return DAY_NAMES[day];
}

function getSelectedDays() {
    return Array.from(
        document.querySelectorAll('input[name="habit-days"]:checked')
    ).map(input => Number(input.value));
}

function getCheckedStatus(habit, date, logs) {
    if (habit.type === "prayer") {
        return PRAYER_ITEMS.every(prayer =>
            logs.some(log =>
                log.date === date &&
                log.itemKey === prayer.id &&
                log.completed
            )
        );
    }

    return logs.some(log =>
        log.date === date &&
        log.itemKey === "done" &&
        log.completed
    );
}

/* =========================================
   NAVIGATION
========================================= */

function setupNavigation() {
    navigation.addEventListener("click", event => {
        const button = event.target.closest(".nav-item");

        if (!button) return;

        const targetPage = button.dataset.page;

        if (targetPage !== "tasks-page" &&
            targetPage !== "habits-page") {
            return;
        }

        showPage(targetPage);
    });
}

function showPage(pageId) {
    document.querySelectorAll("#page-content > section").forEach(section => {
        section.hidden = section.id !== pageId;
    });
    const isTasks = pageId === "tasks-page";

    tasksPage.hidden = !isTasks;
    habitsPage.hidden = isTasks;

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageId
        );
    });

    pageTitle.textContent = isTasks ? "Dashboard" : "Habit Tracker";

    if (!isTasks) {
        loadHabits();
    }
}

/* =========================================
   INITIALIZATION
========================================= */

async function initializeApp() {
    try {
        await initDatabase();

        setupNavigation();

        setupTaskForm();
        setupTaskActions();
        setupFilters();

        setupHabitForm();
        setupHabitActions();
        setupPrayerChecklist();
        setupHistoryControls();

        await loadTasks();

        console.log(
            `${APP_CONFIG.name} versi ${APP_CONFIG.version} siap digunakan.`
        );

    } catch (error) {
        console.error("Application error:", error);

        alert("Gagal menjalankan aplikasi: " + error.message);
    }
}

/* =========================================
   TASK FORM
========================================= */

function setupTaskForm() {
    const cancelButton = document.createElement("button");

    cancelButton.type = "button";
    cancelButton.id = "cancel-edit-btn";
    cancelButton.textContent = "Batal";
    cancelButton.hidden = true;

    saveButton.insertAdjacentElement("afterend", cancelButton);

    cancelButton.addEventListener("click", resetTaskForm);

    taskForm.addEventListener("submit", handleTaskSubmit);
}

async function handleTaskSubmit(event) {
    event.preventDefault();

    const taskData = {
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        priority: priorityInput.value,
        status: statusInput.value,
        dueDate: deadlineInput.value || null
    };

    if (!taskData.title) {
        alert("Judul tugas wajib diisi.");
        titleInput.focus();
        return;
    }

    try {
        saveButton.disabled = true;
        saveButton.textContent = "Menyimpan...";

        if (editingTaskId) {
            await editTask(editingTaskId, taskData);
        } else {
            await createTask(taskData);
        }

        resetTaskForm();
        await loadTasks();

    } catch (error) {
        console.error(error);
        alert("Gagal menyimpan tugas: " + error.message);

    } finally {
        saveButton.disabled = false;
        saveButton.textContent = editingTaskId
            ? "Perbarui Tugas"
            : "Simpan Tugas";
    }
}

function resetTaskForm() {
    taskForm.reset();

    editingTaskId = null;

    saveButton.textContent = "Simpan Tugas";

    const cancelButton = document.getElementById("cancel-edit-btn");

    if (cancelButton) {
        cancelButton.hidden = true;
    }
}

/* =========================================
   LOAD TASKS
========================================= */

async function loadTasks() {
    allTasks = await getTasks();
    renderTasks();
}

/* =========================================
   TASK SUMMARY
========================================= */

function updateTaskSummary() {
    const total = allTasks.length;

    const pending = allTasks.filter(task =>
        task.status === "pending"
    ).length;

    const progress = allTasks.filter(task =>
        task.status === "in_progress"
    ).length;

    const completed = allTasks.filter(task =>
        task.status === "completed"
    ).length;

    summaryTotal.textContent = total;
    summaryPending.textContent = pending;
    summaryProgress.textContent = progress;
    summaryCompleted.textContent = completed;
}

/* =========================================
   DEADLINE MONITORING
========================================= */

function updateDeadlineSummary() {
    const today = getLocalDateString();

    const activeTasks = allTasks.filter(task =>
        task.status !== "completed" &&
        task.dueDate
    );

    const overdue = activeTasks.filter(task =>
        task.dueDate < today
    ).length;

    const dueToday = activeTasks.filter(task =>
        task.dueDate === today
    ).length;

    const upcoming = activeTasks.filter(task =>
        task.dueDate > today
    ).length;

    deadlineOverdue.textContent = overdue;
    deadlineToday.textContent = dueToday;
    deadlineUpcoming.textContent = upcoming;
}

/* =========================================
   TASK SEARCH AND FILTER
========================================= */

function setupFilters() {
    searchInput.addEventListener("input", renderTasks);
    statusFilter.addEventListener("change", renderTasks);
    priorityFilter.addEventListener("change", renderTasks);

    resetFilterButton.addEventListener("click", function() {
        searchInput.value = "";
        statusFilter.value = "all";
        priorityFilter.value = "all";

        renderTasks();
    });
}

function getFilteredTasks() {
    const keyword = searchInput.value.trim().toLowerCase();

    const selectedStatus = statusFilter.value;
    const selectedPriority = priorityFilter.value;

    return allTasks.filter(task => {
        const matchesSearch =
            (task.title || "").toLowerCase().includes(keyword) ||
            (task.description || "").toLowerCase().includes(keyword);

        const matchesStatus =
            selectedStatus === "all" ||
            task.status === selectedStatus;

        const matchesPriority =
            selectedPriority === "all" ||
            task.priority === selectedPriority;

        return matchesSearch && matchesStatus && matchesPriority;
    });
}

/* =========================================
   RENDER TASKS
========================================= */

function renderTasks() {
    updateTaskSummary();
    updateDeadlineSummary();

    const filteredTasks = getFilteredTasks();

    taskList.replaceChildren();

    taskCount.textContent =
        `Menampilkan ${filteredTasks.length} dari ${allTasks.length} tugas`;

    if (filteredTasks.length === 0) {
        const empty = document.createElement("p");

        empty.className = "empty-task-message";
        empty.textContent = allTasks.length === 0
            ? "Belum ada tugas."
            : "Tidak ada tugas yang sesuai dengan pencarian.";

        taskList.appendChild(empty);
        return;
    }

    filteredTasks.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    filteredTasks.forEach(task => {
        const card = document.createElement("article");
        card.className = "task-item";

        const title = document.createElement("h4");
        title.textContent = task.title;

        const description = document.createElement("p");
        description.className = "task-description";
        description.textContent =
            task.description || "Tidak ada deskripsi.";

        const info = document.createElement("div");
        info.className = "task-info";

        const priority = document.createElement("span");
        priority.className =
            `task-badge priority-${task.priority}`;
        priority.textContent =
            PRIORITY_LABELS[task.priority] || "Prioritas Sedang";

        const status = document.createElement("span");
        status.className =
            `task-badge status-${task.status}`;
        status.textContent =
            STATUS_LABELS[task.status] || task.status;

        info.append(priority, status);

        const deadline = document.createElement("div");
        deadline.className = "task-deadline";
        deadline.textContent =
            "Deadline: " + formatDate(task.dueDate);

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "task-action-btn edit";
        editButton.dataset.action = "edit";
        editButton.dataset.id = task.id;
        editButton.textContent = "Edit";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "task-action-btn delete";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = task.id;
        deleteButton.textContent = "Hapus";

        actions.append(editButton, deleteButton);

        card.append(
            title,
            description,
            info,
            deadline,
            actions
        );

        taskList.appendChild(card);
    });
}

/* =========================================
   TASK EDIT AND DELETE
========================================= */

function setupTaskActions() {
    taskList.addEventListener("click", async function(event) {
        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const taskId = button.dataset.id;

        try {
            if (button.dataset.action === "edit") {
                await handleEditTask(taskId);
            } else if (button.dataset.action === "delete") {
                await handleDeleteTask(taskId);
            }

        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan: " + error.message);
        }
    });
}

async function handleEditTask(taskId) {
    const task = await getTask(taskId);

    if (!task) {
        alert("Tugas tidak ditemukan.");
        return;
    }

    editingTaskId = taskId;

    titleInput.value = task.title || "";
    descriptionInput.value = task.description || "";
    priorityInput.value = task.priority || "medium";
    statusInput.value = task.status || "pending";
    deadlineInput.value = task.dueDate || "";

    saveButton.textContent = "Perbarui Tugas";

    document.getElementById("cancel-edit-btn").hidden = false;

    taskForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    titleInput.focus();
}

async function handleDeleteTask(taskId) {
    const task = await getTask(taskId);

    if (!task) {
        alert("Tugas tidak ditemukan.");
        return;
    }

    if (!confirm(`Hapus tugas "${task.title}"?`)) {
        return;
    }

    await removeTask(taskId);

    if (editingTaskId === taskId) {
        resetTaskForm();
    }

    await loadTasks();
}

/* =========================================
   HABIT FORM
========================================= */

function setupHabitForm() {
    habitForm.addEventListener("submit", handleHabitSubmit);

    cancelHabitButton.addEventListener("click", resetHabitForm);
}

async function handleHabitSubmit(event) {
    event.preventDefault();

    const name = habitNameInput.value.trim();
    const scheduledDays = getSelectedDays();

    if (!name) {
        alert("Nama kebiasaan wajib diisi.");
        habitNameInput.focus();
        return;
    }

    if (scheduledDays.length === 0) {
        alert("Pilih minimal satu hari jadwal.");
        return;
    }

    const habitData = {
        name,
        description: habitDescriptionInput.value.trim(),
        category: habitCategoryInput.value,
        scheduledDays
    };

    try {
        saveHabitButton.disabled = true;
        saveHabitButton.textContent = "Menyimpan...";

        if (editingHabitId) {
            await editHabit(editingHabitId, habitData);
        } else {
            await createHabit(habitData);
        }

        resetHabitForm();
        await loadHabits();

    } catch (error) {
        console.error(error);
        alert("Gagal menyimpan kebiasaan: " + error.message);

    } finally {
        saveHabitButton.disabled = false;
        saveHabitButton.textContent = editingHabitId
            ? "Perbarui Kebiasaan"
            : "Simpan Kebiasaan";
    }
}

function resetHabitForm() {
    habitForm.reset();

    editingHabitId = null;

    document.querySelectorAll('input[name="habit-days"]').forEach(input => {
        input.checked = true;
    });

    saveHabitButton.textContent = "Simpan Kebiasaan";
    cancelHabitButton.hidden = true;
}

/* =========================================
   LOAD HABITS
========================================= */

async function loadHabits() {
    try {
        await getOrCreatePrayerHabit();

        const all = await getAllHabits();

        allHabits = all.filter(habit =>
            habit.type !== "prayer" &&
            habit.isActive !== false &&
            habit.isArchived !== true
        );

        archivedHabits = all.filter(habit =>
            habit.type !== "prayer" &&
            habit.isArchived === true
        );

        await renderPrayerChecklist();
        await renderHabitList();
        await renderArchivedHabits();
        await updateHabitSummary();
        await renderHabitHistory();

    } catch (error) {
        console.error("Gagal memuat Habit Tracker:", error);
        alert("Gagal memuat Habit Tracker: " + error.message);
    }
}

/* =========================================
   PRAYER CHECKLIST
========================================= */

function setupPrayerChecklist() {
    prayerChecklist.addEventListener("change", async event => {
        const checkbox = event.target.closest(
            'input[data-prayer-id]'
        );

        if (!checkbox) return;

        try {
            checkbox.disabled = true;

            await setPrayerLog(
                getLocalDateString(),
                checkbox.dataset.prayerId,
                checkbox.checked
            );

            await renderPrayerChecklist();
            await updateHabitSummary();

        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan checklist salat: " + error.message);

        } finally {
            checkbox.disabled = false;
        }
    });
}

async function renderPrayerChecklist() {
    const checklist = await getPrayerChecklist();

    prayerChecklist.replaceChildren();

    checklist.forEach(prayer => {
        const item = document.createElement("div");

        item.className = prayer.completed
            ? "prayer-item completed"
            : "prayer-item";

        const info = document.createElement("div");
        info.className = "prayer-item-info";

        const name = document.createElement("span");
        name.className = "prayer-item-name";
        name.textContent = prayer.name;

        const status = document.createElement("span");
        status.className = "prayer-item-status";
        status.textContent = prayer.completed
            ? "Sudah dilaksanakan"
            : "Belum dicentang";

        info.append(name, status);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "prayer-checkbox";
        checkbox.dataset.prayerId = prayer.id;
        checkbox.checked = prayer.completed;
        checkbox.setAttribute(
            "aria-label",
            `Tandai salat ${prayer.name}`
        );

        item.append(info, checkbox);
        prayerChecklist.appendChild(item);
    });

    const completedCount = checklist.filter(
        prayer => prayer.completed
    ).length;

    prayerProgressText.textContent =
        `${completedCount} dari ${PRAYER_ITEMS.length}`;

    prayerProgressBar.style.width =
        `${(completedCount / PRAYER_ITEMS.length) * 100}%`;
}

/* =========================================
   HABIT CHECKLIST AND LIST
========================================= */

async function renderHabitList() {
    habitList.replaceChildren();

    if (allHabits.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-habit-message";
        empty.textContent = "Belum ada kebiasaan pribadi. Silakan tambahkan kebiasaan baru.";
        habitList.appendChild(empty);
        return;
    }

    const today = getLocalDateString();
    const day = getDateDay(today);

    for (const habit of allHabits) {
        const logs = await getDailyHabitLogs(habit.id, today);

        const completed = logs.some(log =>
            log.itemKey === "done" && log.completed
        );

        const scheduledDays = habit.scheduledDays || [0, 1, 2, 3, 4, 5, 6];
        const isScheduled = scheduledDays.includes(day);

        const card = document.createElement("article");
        card.className = "habit-item";

        const info = document.createElement("div");
        info.className = "habit-item-info";

        const title = document.createElement("h4");
        title.textContent = habit.name;

        const description = document.createElement("p");
        description.className = "habit-item-description";
        description.textContent =
            habit.description || "Tidak ada deskripsi.";

        const meta = document.createElement("div");
        meta.className = "habit-item-meta";

        const category = document.createElement("span");
        category.className = "habit-meta-badge";
        category.textContent = habit.category || "Personal";

        const schedule = document.createElement("span");
        schedule.className = "habit-meta-badge";
        schedule.textContent = isScheduled
            ? "Jadwal hari ini"
            : "Tidak dijadwalkan hari ini";

        meta.append(category, schedule);

        const checkboxContainer = document.createElement("div");
        checkboxContainer.className = "habit-checklist-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = completed;
        checkbox.disabled = !isScheduled;
        checkbox.dataset.habitCheck = habit.id;
        checkbox.id = `habit-check-${habit.id}`;

        const checkboxLabel = document.createElement("label");
        checkboxLabel.htmlFor = checkbox.id;
        checkboxLabel.textContent = isScheduled
            ? "Selesai hari ini"
            : "Bukan jadwal hari ini";

        if (completed) {
            checkboxContainer.classList.add("completed");
        }

        checkboxContainer.append(checkbox, checkboxLabel);

        info.append(title, description, meta, checkboxContainer);

        const actions = document.createElement("div");
        actions.className = "habit-item-actions";

        const editButton = createHabitAction(
            "Edit",
            "edit",
            habit.id
        );

        const archiveButton = createHabitAction(
            "Arsipkan",
            "archive",
            habit.id
        );

        const deleteButton = createHabitAction(
            "Hapus",
            "delete",
            habit.id
        );

        actions.append(editButton, archiveButton, deleteButton);

        card.append(info, actions);
        habitList.appendChild(card);
    }
}

function createHabitAction(label, action, id) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = `habit-action-btn ${action}`;
    button.dataset.habitAction = action;
    button.dataset.id = id;
    button.textContent = label;

    return button;
}

/* =========================================
   HABIT ACTIONS
========================================= */

function setupHabitActions() {
    habitList.addEventListener("change", async event => {
        const checkbox = event.target.closest(
            "input[data-habit-check]"
        );

        if (!checkbox) return;

        try {
            checkbox.disabled = true;

            await setHabitLog(
                checkbox.dataset.habitCheck,
                getLocalDateString(),
                "done",
                checkbox.checked
            );

            await loadHabits();

        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan kebiasaan: " + error.message);
        }
    });

    habitList.addEventListener("click", async event => {
        const button = event.target.closest(
            "button[data-habit-action]"
        );

        if (!button) return;

        const id = button.dataset.id;
        const action = button.dataset.habitAction;

        try {
            if (action === "edit") {
                await handleEditHabit(id);
            }

            if (action === "archive") {
                await handleArchiveHabit(id);
            }

            if (action === "delete") {
                await handleDeleteHabit(id);
            }

        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan: " + error.message);
        }
    });

    archivedHabitList.addEventListener("click", async event => {
        const button = event.target.closest(
            "button[data-habit-action]"
        );

        if (!button) return;

        const id = button.dataset.id;
        const action = button.dataset.habitAction;

        try {
            if (action === "restore") {
                await editHabit(id, {
                    isArchived: false,
                    isActive: true
                });

                await loadHabits();
            }

            if (action === "delete") {
                await handleDeleteHabit(id);
            }

        } catch (error) {
            console.error(error);
            alert("Gagal mengelola arsip: " + error.message);
        }
    });
}

async function handleEditHabit(id) {
    const habit = await getHabit(id);

    if (!habit) {
        alert("Kebiasaan tidak ditemukan.");
        return;
    }

    editingHabitId = id;

    habitNameInput.value = habit.name || "";
    habitDescriptionInput.value = habit.description || "";
    habitCategoryInput.value = habit.category || "Personal";

    const selectedDays = habit.scheduledDays || [];

    document.querySelectorAll('input[name="habit-days"]').forEach(input => {
        input.checked = selectedDays.includes(Number(input.value));
    });

    saveHabitButton.textContent = "Perbarui Kebiasaan";
    cancelHabitButton.hidden = false;

    habitForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    habitNameInput.focus();
}

async function handleArchiveHabit(id) {
    const habit = await getHabit(id);

    if (!habit) return;

    if (!confirm(`Arsipkan kebiasaan "${habit.name}"?`)) {
        return;
    }

    await archiveHabit(id);
    await loadHabits();
}

async function handleDeleteHabit(id) {
    const habit = await getHabit(id);

    if (!habit) return;

    if (!confirm(
        `Hapus permanen kebiasaan "${habit.name}" beserta seluruh riwayatnya?`
    )) {
        return;
    }

    if (editingHabitId === id) {
        resetHabitForm();
    }

    await removeHabit(id);
    await loadHabits();
}

/* =========================================
   ARCHIVED HABITS
========================================= */

async function renderArchivedHabits() {
    archivedHabitList.replaceChildren();

    if (archivedHabits.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-habit-message";
        empty.textContent = "Belum ada kebiasaan yang diarsipkan.";
        archivedHabitList.appendChild(empty);
        return;
    }

    archivedHabits.forEach(habit => {
        const card = document.createElement("article");
        card.className = "habit-item";

        const info = document.createElement("div");
        info.className = "habit-item-info";

        const title = document.createElement("h4");
        title.textContent = habit.name;

        const description = document.createElement("p");
        description.className = "habit-item-description";
        description.textContent =
            habit.description || "Tidak ada deskripsi.";

        info.append(title, description);

        const actions = document.createElement("div");
        actions.className = "habit-item-actions";

        const restoreButton = createHabitAction(
            "Pulihkan",
            "restore",
            habit.id
        );

        const deleteButton = createHabitAction(
            "Hapus Permanen",
            "delete",
            habit.id
        );

        actions.append(restoreButton, deleteButton);

        card.append(info, actions);
        archivedHabitList.appendChild(card);
    });
}

/* =========================================
   HABIT SUMMARY
========================================= */

async function updateHabitSummary() {
    const today = getLocalDateString();

    const prayerChecklistData = await getPrayerChecklist(today);

    const prayerCompleted = prayerChecklistData.every(
        prayer => prayer.completed
    );

    let completedCount = prayerCompleted ? 1 : 0;
    let pendingCount = prayerCompleted ? 0 : 1;
    let highestStreak = 0;

    for (const habit of allHabits) {
        const logs = await getDailyHabitLogs(habit.id, today);

        const completed = logs.some(log =>
            log.itemKey === "done" && log.completed
        );

        if (completed) {
            completedCount++;
        }

        const scheduledDays = habit.scheduledDays || [0, 1, 2, 3, 4, 5, 6];

        if (scheduledDays.includes(getDateDay(today)) && !completed) {
            pendingCount++;
        }

        const stats = await getHabitStats(habit.id);

        highestStreak = Math.max(
            highestStreak,
            stats.currentStreak
        );
    }

    const prayerHabit = await getOrCreatePrayerHabit();
    const prayerStats = await getHabitStats(prayerHabit.id);

    highestStreak = Math.max(
        highestStreak,
        prayerStats.currentStreak
    );

    habitSummaryTotal.textContent = allHabits.length + 1;
    habitSummaryCompleted.textContent = completedCount;
    habitSummaryPending.textContent = pendingCount;
    habitSummaryStreak.textContent = highestStreak;
}

/* =========================================
   HISTORY CONTROLS
========================================= */

function setupHistoryControls() {
    historyDateInput.value = getLocalDateString();

    historyDateInput.addEventListener("change", renderHabitHistory);
    historyTypeInput.addEventListener("change", renderHabitHistory);

    historyList.addEventListener("change", async event => {
        const checkbox = event.target.closest(
            "input[data-history-habit]"
        );

        if (!checkbox) return;

        try {
            checkbox.disabled = true;

            await setHabitLog(
                checkbox.dataset.historyHabit,
                checkbox.dataset.date,
                "done",
                checkbox.checked
            );

            await loadHabits();

        } catch (error) {
            console.error(error);
            alert("Gagal mengubah riwayat: " + error.message);
        }
    });

    historyList.addEventListener("change", async event => {
        const checkbox = event.target.closest(
            "input[data-history-prayer]"
        );

        if (!checkbox) return;

        try {
            checkbox.disabled = true;

            await setPrayerLog(
                checkbox.dataset.date,
                checkbox.dataset.historyPrayer,
                checkbox.checked
            );

            await loadHabits();

        } catch (error) {
            console.error(error);
            alert("Gagal mengubah riwayat salat: " + error.message);
        }
    });
}

/* =========================================
   RENDER HISTORY
========================================= */

async function renderHabitHistory() {
    const selectedDate =
        historyDateInput.value || getLocalDateString();

    const selectedType = historyTypeInput.value;

    await renderHistoryCalendar(selectedDate);

    historyList.replaceChildren();

    if (selectedType === "all" || selectedType === "prayer") {
        await renderPrayerHistoryForDate(selectedDate);
    }

    if (selectedType === "all" || selectedType === "habit") {
        await renderPersonalHabitHistory(selectedDate);
    }

    if (historyList.children.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-habit-message";
        empty.textContent = "Belum ada catatan untuk tanggal ini.";
        historyList.appendChild(empty);
    }
}

async function renderHistoryCalendar(selectedDate) {
    historyCalendar.replaceChildren();

    const [year, month] = selectedDate.split("-").map(Number);

    const daysInMonth = new Date(year, month, 0).getDate();

    const heading = document.createElement("h4");
    heading.textContent = `Riwayat ${month}/${year}`;
    heading.style.marginBottom = "12px";
    heading.style.color = "var(--color-primary)";

    historyCalendar.appendChild(heading);

    const grid = document.createElement("div");

    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(7, minmax(0, 1fr))";
    grid.style.gap = "6px";

    DAY_NAMES.forEach(day => {
        const label = document.createElement("div");

        label.textContent = day.substring(0, 3);
        label.style.textAlign = "center";
        label.style.fontWeight = "700";
        label.style.fontSize = "11px";
        label.style.color = "var(--color-muted)";

        grid.appendChild(label);
    });

    const firstDay = new Date(year, month - 1, 1).getDay();

    for (let i = 0; i < firstDay; i++) {
        grid.appendChild(document.createElement("div"));
    }

    const prayerHabit = await getOrCreatePrayerHabit();
    const prayerLogs = await getHabitLogs(prayerHabit.id);

    const personalLogs = [];

    for (const habit of allHabits) {
        const logs = await getHabitLogs(habit.id);
        personalLogs.push(...logs);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const hasPrayer = prayerLogs.some(log =>
            log.date === date && log.completed
        );

        const hasHabit = personalLogs.some(log =>
            log.date === date &&
            log.itemKey === "done" &&
            log.completed
        );

        const cell = document.createElement("button");

        cell.type = "button";
        cell.textContent = day;

        cell.style.padding = "8px 2px";
        cell.style.border = "1px solid var(--color-border)";
        cell.style.borderRadius = "8px";
        cell.style.background =
            date === selectedDate
                ? "var(--color-primary)"
                : hasPrayer || hasHabit
                    ? "#E6F4EA"
                    : "#FFFFFF";

        cell.style.color =
            date === selectedDate
                ? "#FFFFFF"
                : "var(--color-text)";

        cell.style.cursor = "pointer";
        cell.style.font = "inherit";

        cell.addEventListener("click", () => {
            historyDateInput.value = date;
            renderHabitHistory();
        });

        grid.appendChild(cell);
    }

    historyCalendar.appendChild(grid);
}

async function renderPrayerHistoryForDate(date) {
    const prayerHabit = await getOrCreatePrayerHabit();

    const logs = await getDailyHabitLogs(prayerHabit.id, date);

    const section = document.createElement("div");
    section.className = "habit-history-day";

    const heading = document.createElement("strong");
    heading.textContent = "Salat Lima Waktu";

    section.appendChild(heading);

    PRAYER_ITEMS.forEach(prayer => {
        const log = logs.find(item =>
            item.itemKey === prayer.id
        );

        const row = document.createElement("div");
        row.className = "habit-checklist-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = log?.completed === true;
        checkbox.dataset.historyPrayer = prayer.id;
        checkbox.dataset.date = date;
        checkbox.id = `history-prayer-${prayer.id}`;

        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.textContent = prayer.name;

        row.append(checkbox, label);
        section.appendChild(row);
    });

    historyList.appendChild(section);
}

async function renderPersonalHabitHistory(date) {
    const day = getDateDay(date);

    for (const habit of allHabits) {
        const scheduledDays = habit.scheduledDays || [0, 1, 2, 3, 4, 5, 6];

        if (!scheduledDays.includes(day)) {
            continue;
        }

        const logs = await getDailyHabitLogs(habit.id, date);

        const completed = logs.some(log =>
            log.itemKey === "done" && log.completed
        );

        const section = document.createElement("div");
        section.className = "habit-history-day";

        const row = document.createElement("div");
        row.className = "habit-checklist-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = completed;
        checkbox.dataset.historyHabit = habit.id;
        checkbox.dataset.date = date;
        checkbox.id = `history-habit-${habit.id}`;

        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.textContent = habit.name;

        row.append(checkbox, label);
        section.appendChild(row);

        historyList.appendChild(section);
    }
}

/* =========================================
   START APPLICATION
========================================= */

initializeApp();
