import { supabase } from "./supabase-client.js";
let rows=[];
const results=document.querySelector("#results"), status=document.querySelector("#status");

async function init(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){ location.href="login.html"; return; }
  const {data,error}=await supabase.from("profiles").select("id,first_name,last_name,graduation_year,city,state,street_address,phone,show_address,show_phone,show_email,allow_messages,email").eq("status","approved").order("last_name");
  if(error){status.textContent=error.message;return;}
  rows=data||[]; render();
}
function render(){
  const q=document.querySelector("#search").value.toLowerCase().trim();
  const y=document.querySelector("#year").value.trim();
  const filtered=rows.filter(r=>(!q||`${r.first_name} ${r.last_name} ${r.city||""}`.toLowerCase().includes(q))&&(!y||String(r.graduation_year)===y));
  results.innerHTML=filtered.map(r=>`
    <article class="card person">
      <h3>${esc(r.first_name)} ${esc(r.last_name)}</h3>
      <div class="muted">Class of ${r.graduation_year}</div>
      ${r.city||r.state?`<p>${esc(r.city||"")}${r.city&&r.state?", ":""}${esc(r.state||"")}</p>`:""}
      ${r.show_address&&r.street_address?`<p>${esc(r.street_address)}<br>${esc(r.city||"")}, ${esc(r.state||"")} ${esc(r.zip||"")}</p>`:""}
      ${r.show_phone&&r.phone?`<p>☎ ${esc(r.phone)}</p>`:""}
      ${r.show_email&&r.email?`<p>✉ ${esc(r.email)}</p>`:""}
      ${r.allow_messages?`<a class="button button-small" href="contact.html?id=${encodeURIComponent(r.id)}">Contact</a>`:""}
    </article>`).join("") || `<div class="card"><p>No alumni found.</p></div>`;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
document.querySelector("#search").oninput=render; document.querySelector("#year").oninput=render; init();
