import {
        supabase,
        SITE_BASE
       } from "./supabase-client.js";

const msg = document.querySelector("#message");
const register = document.querySelector("#register-form");
const login = document.querySelector("#login-form");

function show(text, error=false) { if (msg) { msg.textContent=text; msg.className="message "+(error?"error":"success"); } }

if (register) {
  register.addEventListener("submit", async e => {
    e.preventDefault();
    show("Creating account…");
    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: SITE_BASE + "/profile.html",
        data: { first_name: document.querySelector("#first_name").value.trim(),
                last_name: document.querySelector("#last_name").value.trim() } }
    });
    if (error) return show(error.message, true);
    const user = data.user;
    if (!user) return show("Please check your email to verify the account.");
    const p = {
      id:user.id, first_name:document.querySelector("#first_name").value.trim(),
      last_name:document.querySelector("#last_name").value.trim(),
      graduation_year:Number(document.querySelector("#graduation_year").value),
      street_address:document.querySelector("#street_address").value.trim(),
      city:document.querySelector("#city").value.trim(), state:document.querySelector("#state").value.trim().toUpperCase(),
      zip:document.querySelector("#zip").value.trim(), phone:document.querySelector("#phone").value.trim(),
      show_address:document.querySelector("#show_address").checked,
      show_phone:document.querySelector("#show_phone").checked,
      show_email:document.querySelector("#show_email").checked,
      allow_messages:document.querySelector("#allow_messages").checked,
      status:"pending"
    };
    const { error: pe } = await supabase.from("profiles").insert(p);
    if (pe) return show(pe.message, true);
    show("Account created. Check your email to verify your address. Your profile will appear after administrator approval.");
    register.reset();
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
    location.href="directory.html";
  });
}

const logout = document.querySelector("#logout");
if (logout) logout.onclick = async () => { await supabase.auth.signOut(); location.href="index.html"; };
