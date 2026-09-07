import { supabase } from "./supabase-client.js";
const recipientId=new URLSearchParams(location.search).get("id");
const msg=document.querySelector("#message");
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
async function init(){
 const {data:{user}}=await supabase.auth.getUser(); if(!user){location.href="login.html";return;}
 if(!recipientId||recipientId===user.id){location.href="directory.html";return;}
 const {data,error}=await supabase.from("profiles").select("first_name,last_name,allow_messages,status").eq("id",recipientId).single();
 if(error||!data||data.status!=="approved"||!data.allow_messages){msg.textContent="This member is not accepting messages.";document.querySelector("#contact-form").style.display="none";return;}
 document.querySelector("#heading").textContent=`Message ${data.first_name} ${data.last_name}`;
}
document.querySelector("#contact-form").onsubmit=async e=>{
 e.preventDefault(); msg.textContent="Sending…";
 const {data:{user}}=await supabase.auth.getUser();
 const {error}=await supabase.from("messages").insert({sender_id:user.id,recipient_id:recipientId,body:document.querySelector("#body").value.trim()});
 if(error){msg.textContent=error.message;msg.className="message error";return;}
 msg.textContent="Message sent.";msg.className="message success";document.querySelector("#body").value="";
};
init();
