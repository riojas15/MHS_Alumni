import { supabase } from "./supabase-client.js";
import { SITE_BASE } from "./config.js";

const form = document.querySelector("#reset-password-form");
const msg = document.querySelector("#message");
function show(text, error=false) { if (msg) { msg.textContent=text; msg.className="message "+(error?"error":"success"); } }

// Clicking the link in the recovery email lands here with a token in the URL.
// supabase-js reads that automatically on page load and exchanges it for a
// session, firing this event once that's done -- there is nothing for this
// page to parse out of the URL itself.
let recoveryReady = false;
supabase.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") {
    recoveryReady = true;
    show("");
  }
});

// If this page is opened directly rather than via a reset email, no
// PASSWORD_RECOVERY event will ever fire. Give the automatic token exchange
// a moment, then fall back to checking for any session at all.
setTimeout(async () => {
  if (recoveryReady) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    show("This password reset link is invalid or has expired. Request a new one from the login page.", true);
    if (form) form.querySelector("button[type=submit]").disabled = true;
  }
}, 1500);

if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const password = document.querySelector("#password").value;
    const confirm_password = document.querySelector("#confirm_password").value;
    if (password.length < 8) return show("Password must be at least 8 characters.", true);
    if (password !== confirm_password) return show("Passwords do not match.", true);

    show("Updating password…");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return show(error.message, true);

    // updateUser() keeps the recovery session signed in as a normal session,
    // so the member can go straight in rather than logging in again.
    show("Password updated. Redirecting…");
    setTimeout(() => location.href = SITE_BASE + "directory.html", 1200);
  });
}
