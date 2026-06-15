import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
const env={...process.env};
try{for(const l of fs.readFileSync(".env.local","utf8").split("\n")){if(l.includes("=")&&!l.trim().startsWith("#")){const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!env[k])env[k]=l.slice(i+1).trim();}}}catch{}
const admin=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const PW="Demo@1234";
const accts=[
  {email:"demo.owner@sabquick.app",role:"owner",name:"Demo Owner"},
  {email:"demo.manager@sabquick.app",role:"manager",name:"Demo Manager"},
  {email:"demo.staff@sabquick.app",role:"staff",name:"Demo Staff"},
  {email:"demo.delivery@sabquick.app",role:"delivery",name:"Demo Delivery"},
  {email:"demo.customer@sabquick.app",role:"customer",name:"Demo Customer"},
];
// list existing to avoid dup
const { data: existing } = await admin.auth.admin.listUsers({ perPage: 200 });
for (const a of accts){
  const found=(existing?.users||[]).find(u=>u.email===a.email);
  let id;
  if(found){
    id=found.id;
    await admin.auth.admin.updateUserById(id,{password:PW,user_metadata:{name:a.name,role:a.role},email_confirm:true});
  } else {
    const { data, error } = await admin.auth.admin.createUser({email:a.email,password:PW,email_confirm:true,user_metadata:{name:a.name,role:a.role}});
    if(error){console.log("ERR",a.email,error.message);continue;}
    id=data.user.id;
  }
  // ensure profile row role/active
  await admin.from("users").update({role:a.role,name:a.name,is_active:true}).eq("id",id);
  console.log(`✅ ${a.role.padEnd(9)} ${a.email}  (id ${id.slice(0,8)})`);
}
console.log(`\nAll demo accounts password: ${PW}`);
