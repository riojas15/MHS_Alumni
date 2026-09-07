import { supabase } from "./supabase-client.js";
const box=document.querySelector("#messages");
async function init(){
 const {data:{user}}=await supabase.auth.getUser(); if(!user){location.href="login.html";return;}
 const {data,error}=await supabase.from("messages").select("id,body,created_at,read_at,sender:sender_id(first_name,last_name,graduation_year)").eq("recipient_id",user.id).order("created_at",{ascending:false});
 if(error){box.innerHTML=`<div class="card">${error.message}</div>`;return;}
 box.innerHTML=(data||[]).map(m=>`<article class="card message-card"><h3>${esc(m.sender?.first_name)} ${esc(m.sender?.last_name)}</h3><div class="muted">Class of ${m.sender?.graduation_year||""} · ${new Date(m.created_at).toLocaleString()}</div><p>${esc(m.body)}</p></article>`).join("")||`<div class="card"><p>No messages.</p></div>`;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));} init();
