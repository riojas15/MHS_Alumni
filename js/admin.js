import { supabase } from "./supabase-client.js";
const box=document.querySelector("#pending"), status=document.querySelector("#admin-message");
async function init(){
 const {data:{user}}=await supabase.auth.getUser(); if(!user){location.href="login.html";return;}
 const {data:admin}=await supabase.from("admins").select("user_id").eq("user_id",user.id).maybeSingle();
 if(!admin){status.textContent="Administrator access required.";return;}
 load();
}
async function load(){
 const {data,error}=await supabase.from("profiles").select("*").eq("status","pending").order("created_at");
 if(error){status.textContent=error.message;return;}
 box.innerHTML=(data||[]).map(p=>`<article class="card"><h3>${esc(p.first_name)} ${esc(p.last_name)}</h3><p>Class of ${p.graduation_year}</p><p>${esc(p.street_address)}<br>${esc(p.city)}, ${esc(p.state)} ${esc(p.zip)}<br>${esc(p.phone)}<br>${esc(p.email||"")}</p><div class="actions"><button class="button" data-action="approve" data-id="${p.id}">Approve</button><button class="button button-danger" data-action="reject" data-id="${p.id}">Reject</button></div></article>`).join("")||`<div class="card"><p>No pending profiles.</p></div>`;
}
box.onclick=async e=>{const b=e.target.closest("button");if(!b)return;const id=b.dataset.id;const statusValue=b.dataset.action==="approve"?"approved":"rejected";await supabase.from("profiles").update({status:statusValue}).eq("id",id);load();};
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));} init();
