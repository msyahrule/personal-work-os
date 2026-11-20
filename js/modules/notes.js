
/* =====================================
   PERSONAL WORK OS
   NOTES & KNOWLEDGE MANAGEMENT
===================================== */

import {
    createData,
    getAllData,
    getDataById,
    updateData,
    deleteData
} from "../services/storage.js";

// Daftar kategori catatan
export const NOTE_CATEGORIES = [
    "Personal",
    "Work",
    "Learning",
    "Ideas",
    "Finance",
    "Other"
];

// CREATE - Membuat catatan baru
export async function createNote(data) {

    if (!data || typeof data !== "object") {
        throw new Error("Data catatan tidak valid.");
    }

    const title = String(data.title || "").trim();
    const content = String(data.content || "").trim();

    if (!title) {
        throw new Error("Judul catatan wajib diisi.");
    }

    return await createData("notes", {
        title,
        content,
        category: NOTE_CATEGORIES.includes(data.category)
            ? data.category
            : "Other",
        isPinned: false,
        isArchived: false
    });
}

// READ - Mengambil semua catatan aktif
export async function getNotes() {

    const notes = await getAllData("notes");

    return notes
        .filter(note => note.isArchived !== true)
        .sort((a, b) => {

            if (a.isPinned !== b.isPinned) {
                return Number(b.isPinned) - Number(a.isPinned);
            }

            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
}

// READ - Mengambil semua catatan termasuk arsip
export async function getAllNotes() {

    const notes = await getAllData("notes");

    return notes.sort((a, b) =>
        new Date(b.updatedAt) - new Date(a.updatedAt)
    );
}

// READ - Mengambil catatan berdasarkan ID
export async function getNote(id) {
    return await getDataById("notes", id);
}

// UPDATE - Memperbarui catatan
export async function updateNote(id, changes) {

    if (!id) {
        throw new Error("ID catatan tidak ditemukan.");
    }

    const note = await getNote(id);

    if (!note) {
        throw new Error("Catatan tidak ditemukan.");
    }

    const updatedChanges = {};

    if (changes.title !== undefined) {

        const title = String(changes.title).trim();

        if (!title) {
            throw new Error("Judul catatan wajib diisi.");
        }

        updatedChanges.title = title;
    }

    if (changes.content !== undefined) {
        updatedChanges.content = String(changes.content).trim();
    }

    if (changes.category !== undefined) {

        if (!NOTE_CATEGORIES.includes(changes.category)) {
            throw new Error("Kategori catatan tidak valid.");
        }

        updatedChanges.category = changes.category;
    }

    if (changes.isPinned !== undefined) {
        updatedChanges.isPinned = Boolean(changes.isPinned);
    }

    if (changes.isArchived !== undefined) {
        updatedChanges.isArchived = Boolean(changes.isArchived);
    }

    return await updateData("notes", id, updatedChanges);
}

// PIN - Mengatur status pin catatan
export async function toggleNotePin(id) {

    const note = await getNote(id);

    if (!note) {
        throw new Error("Catatan tidak ditemukan.");
    }

    return await updateData("notes", id, {
        isPinned: !note.isPinned
    });
}

// ARCHIVE - Memindahkan catatan ke arsip
export async function archiveNote(id) {

    const note = await getNote(id);

    if (!note) {
        throw new Error("Catatan tidak ditemukan.");
    }

    return await updateData("notes", id, {
        isArchived: true,
        isPinned: false
    });
}

// RESTORE - Mengembalikan catatan dari arsip
export async function restoreNote(id) {

    const note = await getNote(id);

    if (!note) {
        throw new Error("Catatan tidak ditemukan.");
    }

    return await updateData("notes", id, {
        isArchived: false
    });
}

// DELETE - Menghapus catatan secara permanen
export async function removeNote(id) {

    const note = await getNote(id);

    if (!note) {
        throw new Error("Catatan tidak ditemukan.");
    }

    if (note.isArchived !== true) {
        throw new Error(
            "Catatan harus diarsipkan sebelum dihapus permanen."
        );
    }

    return await deleteData("notes", id);
}

// SEARCH - Mencari catatan berdasarkan judul atau isi
export async function searchNotes(keyword) {

    const notes = await getNotes();
    const searchTerm = String(keyword || "")
        .trim()
        .toLowerCase();

    if (!searchTerm) {
        return notes;
    }

    return notes.filter(note => {

        const title = String(note.title || "").toLowerCase();
        const content = String(note.content || "").toLowerCase();
        const category = String(note.category || "").toLowerCase();

        return (
            title.includes(searchTerm) ||
            content.includes(searchTerm) ||
            category.includes(searchTerm)
        );
    });
}

// ARCHIVE - Mengambil seluruh catatan yang diarsipkan
export async function getArchivedNotes() {

    const notes = await getAllData("notes");

    return notes
        .filter(note => note.isArchived === true)
        .sort((a, b) =>
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );
}
