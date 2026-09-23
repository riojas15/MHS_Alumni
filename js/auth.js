import { supabase } from "./supabase-client.js";
import { SITE_BASE } from "./config.js";

const msg = document.querySelector("#message");
const register = document.querySelector("#register-form");
const login = document.querySelector("#login-form");
function show(text, error=false) { if (msg) { msg.textContent=text; msg.className="message "+(error?"error":"success"); } }

if (register) {
  register.addEventListener("submit", async e => {
    e.preventDefault(); show("Creating account…");
    const first_name = document.querySelector("#first_name").value.trim();
    const last_name = document.querySelector("#last_name").value.trim();
    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;
    const graduation_year = Number(document.querySelector("#graduation_year").value);
    // GRAD_MIN/GRAD_MAX must match the profiles_graduation_year_check
    // constraint and the handle_new_user() bounds in sql/schema.sql.
    // If they drift apart, the database rejects the insert and signUp()
    // fails with an opaque "Database error saving new user".
    const GRAD_MIN = 1940, GRAD_MAX = 2040;
    if (!first_name || !last_name) return show("Please enter your first and last name.", true);
    if (!Number.isInteger(graduation_year) || graduation_year < GRAD_MIN || graduation_year > GRAD_MAX)
      return show(`Please enter a graduation year between ${GRAD_MIN} and ${GRAD_MAX}.`, true);
    if (!document.querySelector("#consent").checked) return show("Please authorize your profile to be included in the private directory.", true);

    const metadata = {
      first_name, last_name, graduation_year,
      street_address: document.querySelector("#street_address").value.trim(),
      city: document.querySelector("#city").value.trim(),
      state: document.querySelector("#state").value.trim().toUpperCase(),
      zip: document.querySelector("#zip").value.trim(),
      phone: document.querySelector("#phone").value.trim(),
      show_address: document.querySelector("#show_address").checked,
      show_phone: document.querySelector("#show_phone").checked,
      show_email: document.querySelector("#show_email").checked,
      allow_messages: document.querySelector("#allow_messages").checked
    };

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: SITE_BASE + "profile.html", data: metadata }
    });
    if (error) return show(error.message, true);

    // The database trigger creates the pending profile from auth metadata.
    // This works even when email confirmation means there is no browser session yet.
    register.reset();
    if (data.session) show("Account created. Your profile is pending administrator approval.");
    else show("Account created. Check your email to verify your address. Your profile will appear after administrator approval.");
  });
}

if (login) {
  login.addEventListener("submit", async e => {
    e.preventDefault(); show("Signing in…");
    const { error } = await supabase.auth.signInWithPassword({
      email:document.querySelector("#email").value.trim(),
      password:document.querySelector("#password").value
    });
    if (error) return show(error.message, true);
    location.href = SITE_BASE + "directory.html";
  });
}
const logout = document.querySelector("#logout");
if (logout) logout.onclick = async () => { await supabase.auth.signOut(); location.href = SITE_BASE + "index.html"; };

const forgotToggle = document.querySelector("#forgot-toggle");
const resetRequest = document.querySelector("#reset-request-form");
if (forgotToggle && resetRequest) {
  forgotToggle.addEventListener("click", e => {
    e.preventDefault();
    resetRequest.hidden = !resetRequest.hidden;
    forgotToggle.textContent = resetRequest.hidden ? "Forgot your password?" : "Back to login";
  });
  const resetMsg = document.querySelector("#reset-message");
  function showReset(text, error=false) { if (resetMsg) { resetMsg.textContent=text; resetMsg.className="message "+(error?"error":"success"); } }
  resetRequest.addEventListener("submit", async e => {
    e.preventDefault(); showReset("Sending reset link…");
    const email = document.querySelector("#reset-email").value.trim();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: SITE_BASE + "reset-password.html"
    });
    // Supabase intentionally returns success even for an unregistered email,
    // to avoid revealing which addresses have accounts.
    if (error) return showReset(error.message, true);
    showReset("If that email is registered, a reset link is on its way. Check your inbox.");
  });
}
