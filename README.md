# Personal Work OS

Personal Work OS is an offline-first personal workspace built with HTML, CSS, vanilla JavaScript, and IndexedDB.

## Preserved application modules
- My Tasks (create, edit, delete, search, status/priority filters, deadlines and summary)
- Habit Tracker (habit CRUD, schedules, prayer checklist, history, archive)
- Notes & Knowledge (notes CRUD, categories, pinning, archive and search)

## UI redesign
The main Overview dashboard adds live previews for Tasks, Habits and Notes, focus items, activity range controls, refresh actions, and shortcuts to the original forms. The redesign is additive: original feature modules, IndexedDB name/version, data stores, and existing feature page markup are retained.

## Run locally
Serve this folder using VS Code Live Server or `python3 -m http.server 8000`, then open the served page. ES modules and IndexedDB require a local HTTP origin (not a `file://` URL).

## Validation
JavaScript syntax and ZIP integrity are checked in the generated package. Browser end-to-end interaction should still be tested in the user's Codespaces/browser before publishing.
