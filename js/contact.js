import { supabase } from "./supabase-client.js";
const recipientId=new URLSearchParams(location.search).get("id");
const msg=document.querySelector("#message");
async function init(){
 const {data:{user}}=await supabase.auth.getUser(); if(!user){location.href="login.html";return;}
 if(!recipientId||recipientId===user.id){location.href="directory.html";return;}
 const {data,error}=await supabase.rpc("get_contact_target",{target_id:recipientId});
 if(error||!data||!data.length){msg.textContent="This member is not accepting messages.";document.querySelector("#contact-form").style.display="none";return;}
 document.querySelector("#heading").textContent=`Message ${data[0].first_name} ${data[0].last_name}`;
}
document.querySelector("#contact-form").onsubmit=async e=>{
 e.preventDefault(); msg.textContent="Sending…";
 const body=document.querySelector("#body").value.trim(); if(!body)return;
 const {error}=await supabase.from("messages").insert({sender_id:(await supabase.auth.getUser()).data.user.id,recipient_id:recipientId,body});
 if(error){msg.textContent=error.message;msg.className="message error";return;}
 msg.textContent="Message sent.";msg.className="message success";document.querySelector("#body").value="";
}; init();
