
/* =====================================
   PERSONAL WORK OS
   STEP 9.2 - TASK MODULE
===================================== */

import {
    createData,
    getAllData,
    getDataById,
    updateData,
    deleteData
} from "../services/storage.js";

// Create task
export async function createTask(taskData) {

    if (!taskData.title || !taskData.title.trim()) {
        throw new Error("Judul tugas wajib diisi.");
    }

    return await createData("tasks", {
        title: taskData.title.trim(),
        description: taskData.description || "",
        status: taskData.status || "pending",
        priority: taskData.priority || "medium",
        dueDate: taskData.dueDate || null,
        projectId: taskData.projectId || null
    });

}

// Get all tasks
export async function getTasks() {

    return await getAllData("tasks");

}

// Get task by ID
export async function getTask(id) {

    return await getDataById("tasks", id);

}

// Update task
export async function editTask(id, changes) {

    if (changes.title !== undefined && !changes.title.trim()) {
        throw new Error("Judul tugas tidak boleh kosong.");
    }

    return await updateData("tasks", id, changes);

}

// Delete task
export async function removeTask(id) {

    return await deleteData("tasks", id);

}

console.log("Task module berhasil dimuat.");
