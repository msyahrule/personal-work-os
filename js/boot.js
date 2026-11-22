import { supabase, isSupabaseConfigured } from "./supabase-client.js";
import { startCloudSync, syncAll } from "./cloud-sync.js";

const status = document.getElementById("pwo-sync-status");
const logout = document.getElementById("pwo-logout");

function setStatus(kind, text) {
  if (!status) return;
  status.className = `header-live pwo-sync-${kind}`;
  status.innerHTML = `<i></i>${text}`;
}

async function boot() {
  if (!isSupabaseConfigured()) {
    location.replace("./login.html?setup=required");
    return;
  }
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    location.replace("./login.html");
    return;
  }

  logout?.addEventListener("click", async () => {
    logout.disabled = true;
    logout.textContent = "Keluar...";
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (e) {
      console.error("Logout:", e);
      alert("Gagal logout. Coba kembali.");
      logout.disabled = false;
      logout.textContent = "Keluar";
      return;
    }
    location.replace("./login.html");
  });

  // Initial cloud merge happens before app modules render their data.
  setStatus("syncing", "Menyinkronkan...");
  try {
    await syncAll();
    setStatus("ready", "Cloud tersinkron");
  } catch (e) {
    console.error("Initial sync:", e);
    setStatus("error", "Sync gagal — data lokal aman");
  }
  startCloudSync(setStatus);

  // Load the original application only after authentication has been checked.
  await import("./app.js");
  await import("./notes-app.js");
  await import("./dashboard.js");
}

boot().catch(error => {
  console.error("PWO startup error:", error);
  setStatus("error", "Aplikasi gagal dimulai");
});
