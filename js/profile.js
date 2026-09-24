import { supabase } from "./supabase-client.js";
const ids = [
  "first_name",
  "last_name",
  "graduation_year",
  "street_address",
  "city",
  "state",
  "zip",
  "phone",
  "show_address",
  "show_phone",
  "show_email",
  "allow_messages",
];
async function init() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    location.href = "login.html";
    return;
  }
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,first_name,last_name,graduation_year,street_address,city,state,zip,phone,show_address,show_phone,show_email,allow_messages,status",
    )
    .eq("id", user.id)
    .single();
  if (error) {
    document.querySelector("#message").textContent = error.message;
    return;
  }
  ids.forEach((id) => {
    const el = document.querySelector("#" + id);
    if (el)
      el.type === "checkbox"
        ? (el.checked = !!data[id])
        : (el.value = data[id] ?? "");
  });
  document.querySelector("#approval").textContent =
    `Profile status: ${data.status}.`;
}
document.querySelector("#profile-form").onsubmit = async (e) => {
  e.preventDefault();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const p = {};
  ids.forEach((id) => {
    const el = document.querySelector("#" + id);
    p[id] = el.type === "checkbox" ? el.checked : el.value;
  });
  // Number("") is 0, which violates the 1940-2040 CHECK constraint and would
  // surface as a raw Postgres error. Validate before sending.
  const GRAD_MIN = 1940,
    GRAD_MAX = 2040;
  p.graduation_year = Number(String(p.graduation_year).trim());
  const m0 = document.querySelector("#message");
  if (
    !Number.isInteger(p.graduation_year) ||
    p.graduation_year < GRAD_MIN ||
    p.graduation_year > GRAD_MAX
  ) {
    m0.textContent = `Please enter a graduation year between ${GRAD_MIN} and ${GRAD_MAX}.`;
    m0.className = "message error";
    return;
  }
  const { error } = await supabase.from("profiles").update(p).eq("id", user.id);
  const m = document.querySelector("#message");
  m.textContent = error ? error.message : "Saved.";
  m.className = "message " + (error ? "error" : "success");
};
init();
