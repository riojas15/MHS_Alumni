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
    if (!first_name || !last_name || !Number.isInteger(graduation_year) || graduation_year < 1900 || graduation_year > 2100) return show("Please enter a valid name and graduation year.", true);
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
