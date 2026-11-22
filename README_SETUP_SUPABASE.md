# Personal Work OS — Auth + Cloud Sync package

This package is based on the uploaded `redesign-ui` project. Existing application pages, CSS, task/habit/note modules, and IndexedDB data store names are retained. The login/authentication layer and cloud sync boot process are added.

## 1. Configure Supabase (only URL + Publishable key in the app)

1. Open `js/supabase-client.js`.
2. Replace `PASTE_SUPABASE_PROJECT_URL_HERE` with your Supabase Project URL.
3. Replace `PASTE_SUPABASE_PUBLISHABLE_KEY_HERE` with your **Publishable key**.
4. Save the file.

Use only the publishable key (or legacy anon key). **Never paste a Secret/service_role key into this browser app.** The Publishable key is designed to be public; RLS protects user data.

## 2. Supabase database

If the `public.pwo_records` table and RLS policies from the earlier setup already exist, you do not need to run SQL again. Otherwise, open Supabase SQL Editor and run `SUPABASE_SETUP.sql`.

Check:
- `public.pwo_records` exists.
- RLS is enabled.
- SELECT/INSERT/UPDATE/DELETE policies restrict records to `auth.uid() = user_id`.
- Data API is enabled for the project.

## 3. Auth redirect allowlist

In Supabase Dashboard → Authentication → URL Configuration, add these Redirect URLs (adjust if your hosting path differs):

- `http://localhost:8000/**`
- `https://msyahrule.github.io/personal-work-os/**`
- `https://*.app.github.dev/**`

For Site URL, use your deployed app base URL if you primarily use GitHub Pages:
`https://msyahrule.github.io/personal-work-os/`

## 4. Create the login user

Supabase → Authentication → Users → Add user. Use the email and password you intend to use for PWO. Confirm the email if your project requires it.

## 5. Run locally in Codespaces

Open terminal in the project root (the folder containing `index.html`):

```bash
python3 -m http.server 8000
```

Open the Ports tab → port 8000 → Open in Browser. Visit `/login.html`. Do not use `file://`.

## 6. Cloud sync behavior

- Login is required before the app modules load.
- Initial sync merges local IndexedDB and cloud records by `updatedAt` (newer record wins).
- A sync is attempted at startup, when browser regains focus/online, and every 30 seconds.
- The header shows sync status; use refresh/reload if you want to force a new sync.
- Delete operations create cloud tombstones so deletions can propagate to other devices.
- Cloud sync requires internet access. Existing local IndexedDB remains on the device.

## Important first-time use

The first successful sync can upload existing local records to the signed-in Supabase account. Sign in only with the account that should own this PWO data. Do not test with another person's account on a device containing your private local records.

## Troubleshooting

- `Invalid login credentials`: verify email/password and user confirmation in Supabase Auth.
- `Failed to fetch`: verify Project URL/key, internet, and Supabase project status.
- `401/403` or RLS error: check table grants and policies; do not disable RLS.
- `404 auth.js`: check that `login.html` loads `./js/auth.js` and the file exists.
- If a page is cached old, refresh with Ctrl+Shift+R. The service worker cache version was updated in this package.

## Security

This app uses Supabase Auth in the browser and relies on RLS. No secret key is included. Passwords are not stored by PWO. Never put email/password in URL parameters.
