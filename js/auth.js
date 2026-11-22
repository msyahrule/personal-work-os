import { supabase, isSupabaseConfigured } from "./supabase-client.js";

const $ = id => document.getElementById(id);
const form = $("login-form");
const email = $("login-email");
const password = $("login-password");
const submit = $("login-submit");
const message = $("login-message");
const showPassword = $("show-password");
const forgot = $("forgot-password");

function showMessage(text, kind = "error") {
  if (!message) return;
  message.textContent = text;
  message.className = `login-message ${kind}`;
}
function cleanCurrentUrl() {
  // Prevent credentials from remaining in a query string / browser history.
  if (location.search) history.replaceState({}, document.title, location.pathname + location.hash);
}
cleanCurrentUrl();

if (!isSupabaseConfigured()) {
  showMessage("Konfigurasi Supabase belum diisi. Isi Project URL dan Publishable Key di js/supabase-client.js.");
  if (submit) submit.disabled = true;
} else {
  supabase.auth.getSession().then(({ data, error }) => {
    if (!error && data.session) location.replace("./index.html");
  }).catch(error => console.error("Session check:", error));
}

showPassword?.addEventListener("click", () => {
  const visible = password.type === "password";
  password.type = visible ? "text" : "password";
  showPassword.textContent = visible ? "Sembunyikan" : "Tampilkan";
});

form?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!isSupabaseConfigured()) return;
  showMessage("");
  submit.disabled = true;
  submit.textContent = "Memeriksa akun...";
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value
    });
    if (error) throw error;
    if (!data.session) throw new Error("Session belum terbentuk. Coba login kembali.");
    showMessage("Login berhasil. Membuka PWO...", "success");
    location.replace("./index.html");
  } catch (error) {
    console.error("Login error:", error);
    showMessage(error.message || "Login gagal. Periksa email dan password.");
  } finally {
    submit.disabled = false;
    submit.textContent = "Masuk ke PWO →";
  }
});

forgot?.addEventListener("click", async event => {
  event.preventDefault();
  if (!isSupabaseConfigured()) return;
  const userEmail = email.value.trim();
  if (!userEmail) {
    showMessage("Isi email terlebih dahulu, lalu pilih Lupa password.");
    email.focus();
    return;
  }
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: new URL("./login.html", location.href).href
    });
    if (error) throw error;
    showMessage("Jika email terdaftar, instruksi reset password akan dikirim.", "success");
  } catch (error) {
    console.error("Password reset:", error);
    showMessage(error.message || "Tidak dapat mengirim email reset password.");
  }
});
