
/* =====================================
   PERSONAL WORK OS
   NOTES APPLICATION
===================================== */

import {
    createNote,
    getNotes,
    getArchivedNotes,
    getNote,
    updateNote,
    toggleNotePin,
    archiveNote,
    restoreNote,
    removeNote,
    searchNotes,
    NOTE_CATEGORIES
} from "./modules/notes.js";

/* =====================================
   STATE
===================================== */

let editingNoteId = null;
let showingArchive = false;

/* =====================================
   DOM ELEMENTS
===================================== */

const navigation = document.getElementById("main-navigation");
const pageContent = document.getElementById("page-content");
const pageTitle = document.getElementById("page-title");

if (!navigation || !pageContent || !pageTitle) {
    throw new Error("Elemen utama aplikasi tidak ditemukan.");
}

/* =====================================
   CREATE NOTES NAVIGATION
===================================== */

const notesNavButton = document.createElement("button");

notesNavButton.type = "button";
notesNavButton.className = "nav-item";
notesNavButton.dataset.page = "notes-page";
notesNavButton.textContent = "Notes";

navigation.appendChild(notesNavButton);

/* =====================================
   CREATE NOTES PAGE
===================================== */

const notesPage = document.createElement("section");

notesPage.id = "notes-page";
notesPage.hidden = true;

notesPage.innerHTML = `
    <div class="page-heading">
        <div>
            <h2>Notes & Knowledge</h2>
            <p>Simpan ide, informasi, dan catatan pentingmu.</p>
        </div>
    </div>

    <section class="notes-summary-grid">
        <article class="summary-card">
            <div class="summary-card-label">Total Catatan</div>
            <div class="summary-card-value" id="notes-total">0</div>
        </article>

        <article class="summary-card">
            <div class="summary-card-label">Catatan Dipin</div>
            <div class="summary-card-value" id="notes-pinned">0</div>
        </article>

        <article class="summary-card">
            <div class="summary-card-label">Catatan Diarsipkan</div>
            <div class="summary-card-value" id="notes-archived">0</div>
        </article>
    </section>

    <section class="notes-section">

        <div class="section-heading">
            <h3 id="notes-form-heading">Buat Catatan Baru</h3>
            <p>Tulis dan simpan informasi yang ingin kamu ingat.</p>
        </div>

        <form id="notes-form">

            <div class="form-group">
                <label for="notes-title">Judul Catatan</label>
                <input
                    type="text"
                    id="notes-title"
                    placeholder="Masukkan judul catatan..."
                    required
                >
            </div>

            <div class="form-group">
                <label for="notes-category">Kategori</label>
                <select id="notes-category">
                    ${NOTE_CATEGORIES.map(category =>
                        `<option value="${category}">${category}</option>`
                    ).join("")}
                </select>
            </div>

            <div class="form-group">
                <label for="notes-content">Isi Catatan</label>
                <textarea
                    id="notes-content"
                    rows="7"
                    placeholder="Tulis isi catatan di sini..."
                ></textarea>
            </div>

            <div class="notes-form-actions">
                <button type="submit" id="notes-save-btn">
                    Simpan Catatan
                </button>

                <button
                    type="button"
                    id="notes-cancel-btn"
                    hidden
                >
                    Batal Edit
                </button>
            </div>

        </form>

    </section>

    <section class="notes-section">

        <div class="section-heading">
            <h3 id="notes-list-heading">Daftar Catatan</h3>
            <p>Temukan dan kelola semua catatanmu.</p>
        </div>

        <div class="notes-toolbar">

            <input
                type="search"
                id="notes-search"
                placeholder="Cari judul, isi, atau kategori..."
            >

            <button type="button" id="notes-archive-toggle">
                Lihat Arsip
            </button>

        </div>

        <div id="notes-list">
            <p class="empty-notes-message">
                Memuat catatan...
            </p>
        </div>

    </section>
`;

// Tambahkan halaman Notes ke dalam page-content
pageContent.appendChild(notesPage);

/* =====================================
   ELEMENT REFERENCES
===================================== */

const notesForm = document.getElementById("notes-form");
const notesTitle = document.getElementById("notes-title");
const notesCategory = document.getElementById("notes-category");
const notesContent = document.getElementById("notes-content");

const notesSaveButton = document.getElementById("notes-save-btn");
const notesCancelButton = document.getElementById("notes-cancel-btn");

const notesList = document.getElementById("notes-list");
const notesSearch = document.getElementById("notes-search");

const notesTotal = document.getElementById("notes-total");
const notesPinned = document.getElementById("notes-pinned");
const notesArchived = document.getElementById("notes-archived");

const notesFormHeading = document.getElementById("notes-form-heading");
const notesListHeading = document.getElementById("notes-list-heading");

const notesArchiveToggle = document.getElementById("notes-archive-toggle");

/* =====================================
   NAVIGATION
===================================== */

// Gunakan capture agar navigasi Notes tidak diproses
// oleh navigasi Tasks dan Habit Tracker yang sudah ada.
navigation.addEventListener("click", event => {

    const button = event.target.closest(".nav-item");

    if (!button || button.dataset.page !== "notes-page") {
        return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    showNotesPage();

}, true);

function showNotesPage() {

    const dashboardPage = document.getElementById("dashboard-page");
    if (dashboardPage) dashboardPage.hidden = true;
    document.getElementById("tasks-page").hidden = true;
    document.getElementById("habits-page").hidden = true;

    notesPage.hidden = false;

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === "notes-page"
        );
    });

    pageTitle.textContent = "Notes & Knowledge";

    loadNotes();
}

/* =====================================
   LOAD NOTES
===================================== */

async function loadNotes() {

    try {

        const notes = showingArchive
            ? await getArchivedNotes()
            : await getNotes();

        renderNotes(notes);
        await updateNotesSummary();

    } catch (error) {

        console.error("Gagal memuat catatan:", error);

        notesList.innerHTML = `
            <p class="empty-notes-message">
                Gagal memuat catatan.
            </p>
        `;
    }
}

/* =====================================
   RENDER NOTES
===================================== */

function renderNotes(notes) {

    if (!notes.length) {

        notesList.innerHTML = `
            <p class="empty-notes-message">
                ${showingArchive
                    ? "Belum ada catatan yang diarsipkan."
                    : "Belum ada catatan. Silakan buat catatan baru."}
            </p>
        `;

        return;
    }

    notesList.innerHTML = "";

    notes.forEach(note => {

        const card = document.createElement("article");
        card.className = "note-card";

        if (note.isPinned) {
            card.classList.add("note-pinned");
        }

        const header = document.createElement("div");
        header.className = "note-card-header";

        const title = document.createElement("h4");
        title.textContent = note.title;

        const category = document.createElement("span");
        category.className = "note-category";
        category.textContent = note.category || "Other";

        header.append(title, category);

        const content = document.createElement("p");
        content.className = "note-card-content";
        content.textContent = note.content || "Tidak ada isi catatan.";

        const metadata = document.createElement("small");
        metadata.className = "note-metadata";

        metadata.textContent =
            `Diperbarui: ${formatNoteDate(note.updatedAt)}`;

        const actions = document.createElement("div");
        actions.className = "note-card-actions";

        if (showingArchive) {

            actions.append(
                createActionButton(
                    "Pulihkan",
                    "restore",
                    note.id
                ),
                createActionButton(
                    "Hapus Permanen",
                    "delete",
                    note.id
                )
            );

        } else {

            actions.append(
                createActionButton(
                    note.isPinned ? "Lepas Pin" : "Pin",
                    "pin",
                    note.id
                ),
                createActionButton(
                    "Edit",
                    "edit",
                    note.id
                ),
                createActionButton(
                    "Arsipkan",
                    "archive",
                    note.id
                )
            );
        }

        card.append(
            header,
            content,
            metadata,
            actions
        );

        notesList.appendChild(card);
    });
}

/* =====================================
   ACTION BUTTON
===================================== */

function createActionButton(label, action, id) {

    const button = document.createElement("button");

    button.type = "button";
    button.className = "note-action-btn";
    button.textContent = label;

    button.dataset.action = action;
    button.dataset.id = id;

    return button;
}

/* =====================================
   SAVE NOTE
===================================== */

notesForm.addEventListener("submit", async event => {

    event.preventDefault();

    const data = {
        title: notesTitle.value.trim(),
        content: notesContent.value.trim(),
        category: notesCategory.value
    };

    try {

        notesSaveButton.disabled = true;

        if (editingNoteId) {

            await updateNote(editingNoteId, data);

        } else {

            await createNote(data);
        }

        resetNotesForm();

        await loadNotes();

    } catch (error) {

        console.error("Gagal menyimpan catatan:", error);

        alert(error.message || "Gagal menyimpan catatan.");

    } finally {

        notesSaveButton.disabled = false;
    }
});

/* =====================================
   RESET FORM
===================================== */

function resetNotesForm() {

    editingNoteId = null;

    notesForm.reset();

    notesFormHeading.textContent = "Buat Catatan Baru";
    notesSaveButton.textContent = "Simpan Catatan";

    notesCancelButton.hidden = true;
}

/* =====================================
   CANCEL EDIT
===================================== */

notesCancelButton.addEventListener("click", () => {
    resetNotesForm();
});

/* =====================================
   NOTES ACTIONS
===================================== */

notesList.addEventListener("click", async event => {

    const button = event.target.closest("[data-action]");

    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    try {

        if (action === "edit") {

            await handleEditNote(id);

        } else if (action === "pin") {

            await toggleNotePin(id);
            await loadNotes();

        } else if (action === "archive") {

            const confirmed = confirm(
                "Arsipkan catatan ini?"
            );

            if (!confirmed) return;

            await archiveNote(id);
            await loadNotes();

        } else if (action === "restore") {

            await restoreNote(id);
            await loadNotes();

        } else if (action === "delete") {

            const confirmed = confirm(
                "Catatan ini akan dihapus permanen. Tindakan ini tidak dapat dibatalkan. Lanjutkan?"
            );

            if (!confirmed) return;

            await removeNote(id);
            await loadNotes();
        }

    } catch (error) {

        console.error("Gagal memproses catatan:", error);

        alert(error.message || "Terjadi kesalahan.");
    }
});

/* =====================================
   EDIT NOTE
===================================== */

async function handleEditNote(id) {

    const note = await getNote(id);

    if (!note) {
        throw new Error("Catatan tidak ditemukan.");
    }

    editingNoteId = id;

    notesTitle.value = note.title || "";
    notesContent.value = note.content || "";
    notesCategory.value = note.category || "Other";

    notesFormHeading.textContent = "Edit Catatan";
    notesSaveButton.textContent = "Perbarui Catatan";

    notesCancelButton.hidden = false;

    notesForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/* =====================================
   SEARCH
===================================== */

let searchTimeout = null;

notesSearch.addEventListener("input", () => {

    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(async () => {

        try {

            const keyword = notesSearch.value.trim();

            if (showingArchive) {

                const archived = await getArchivedNotes();

                const filtered = archived.filter(note => {

                    const searchText = [
                        note.title,
                        note.content,
                        note.category
                    ].join(" ").toLowerCase();

                    return searchText.includes(keyword.toLowerCase());
                });

                renderNotes(filtered);

            } else {

                const results = await searchNotes(keyword);

                renderNotes(results);
            }

        } catch (error) {

            console.error("Pencarian catatan gagal:", error);
        }

    }, 250);
});

/* =====================================
   ARCHIVE TOGGLE
===================================== */

notesArchiveToggle.addEventListener("click", async () => {

    showingArchive = !showingArchive;

    resetNotesForm();

    notesSearch.value = "";

    notesArchiveToggle.textContent = showingArchive
        ? "Kembali ke Catatan"
        : "Lihat Arsip";

    notesListHeading.textContent = showingArchive
        ? "Arsip Catatan"
        : "Daftar Catatan";

    await loadNotes();
});

/* =====================================
   NOTES SUMMARY
===================================== */

async function updateNotesSummary() {

    const activeNotes = await getNotes();
    const archivedNotes = await getArchivedNotes();

    notesTotal.textContent = activeNotes.length;

    notesPinned.textContent = activeNotes.filter(
        note => note.isPinned === true
    ).length;

    notesArchived.textContent = archivedNotes.length;
}

/* =====================================
   DATE FORMAT
===================================== */

function formatNoteDate(dateString) {

    if (!dateString) return "-";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

/* =====================================
   INITIALIZATION
===================================== */

loadNotes().catch(error => {
    console.error("Notes initialization error:", error);
});
