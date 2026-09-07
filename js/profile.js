import { supabase } from "./supabase-client.js";
const ids=["first_name","last_name","graduation_year","street_address","city","state","zip","phone","show_address","show_phone","show_email","allow_messages"];
async function init(){
 const {data:{user}}=await supabase.auth.getUser(); if(!user){location.href="login.html";return;}
 const {data,error}=await supabase.from("profiles").select("*").eq("id",user.id).single();
 if(error){document.querySelector("#message").textContent=error.message;return;}
 ids.forEach(id=>{const el=document.querySelector("#"+id); if(el) el.type==="checkbox"?el.checked=!!data[id]:el.value=data[id]??"";});
 document.querySelector("#approval").textContent=`Profile status: ${data.status}.`;
}
document.querySelector("#profile-form").onsubmit=async e=>{
 e.preventDefault();const {data:{user}}=await supabase.auth.getUser();
 const p={}; ids.forEach(id=>{const el=document.querySelector("#"+id);p[id]=el.type==="checkbox"?el.checked:el.value;});
 p.graduation_year=Number(p.graduation_year);
 const {error}=await supabase.from("profiles").update(p).eq("id",user.id);
 const m=document.querySelector("#message");m.textContent=error?error.message:"Saved. Changes may require administrator approval.";m.className="message "+(error?"error":"success");
}; init();
