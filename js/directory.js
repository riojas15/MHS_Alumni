import { supabase } from "./supabase-client.js";
let rows=[];
const results=document.querySelector("#results"), status=document.querySelector("#status");
async function init(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){location.href="login.html";return;}
  const {data,error}=await supabase.rpc("get_directory_profiles");
  if(error){status.textContent=error.message;status.className="message error";return;}
  rows=data||[]; render();
}
function render(){
  const q=document.querySelector("#search").value.toLowerCase().trim();
  const y=document.querySelector("#year").value.trim();
  const filtered=rows.filter(r=>(!q||`${r.first_name} ${r.last_name} ${r.city||""}`.toLowerCase().includes(q))&&(!y||String(r.graduation_year)===y));
  if(!filtered.length){results.innerHTML=`<table class="directory"><tbody><tr><td class="empty">No alumni found.</td></tr></tbody></table>`;return;}
  results.innerHTML=`
    <table class="directory">
      <thead><tr><th>Name</th><th>Class</th><th>Location</th><th>Phone</th><th>Email</th><th></th></tr></thead>
      <tbody>
        ${filtered.map(r=>`
        <tr>
          <td class="name">${esc(r.first_name)} ${esc(r.last_name)}</td>
          <td>${r.graduation_year}</td>
          <td class="${r.city||r.state?"":"muted-cell"}">${r.city||r.state?`${esc(r.city||"")}${r.city&&r.state?", ":""}${esc(r.state||"")}`:"—"}</td>
          <td class="${r.phone?"":"muted-cell"}">${r.phone?esc(r.phone):"—"}</td>
          <td class="${r.email?"":"muted-cell"}">${r.email?esc(r.email):"—"}</td>
          <td>${r.allow_messages?`<a class="button button-small" href="contact.html?id=${encodeURIComponent(r.id)}">Contact</a>`:""}</td>
        </tr>`).join("")}
      </tbody>
    </table>`;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
document.querySelector("#search").oninput=render; document.querySelector("#year").oninput=render; init();
