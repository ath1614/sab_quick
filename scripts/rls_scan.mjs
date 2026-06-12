import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
const env=Object.fromEntries(fs.readFileSync(".env.local","utf8").split("\n").filter(l=>l.includes("=")&&!l.trim().startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(),l.slice(i+1).trim()];}));
const anon=createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {auth:{persistSession:false}});
const admin=createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false}});
const tables=["users","orders","order_items","addresses","transactions","notifications","deliveries","inventory","analytics_events","delivery_locations","coupons","products","categories","banners"];
console.log("table            anonReads  total   EXPOSED?");
for (const t of tables){
  const { data, error } = await anon.from(t).select("*").limit(100);
  const { count } = await admin.from(t).select("*",{count:"exact",head:true});
  const n = data?.length ?? 0;
  // products/categories/coupons(active)/banners(active) are intentionally public-read
  const publicOk = ["products","categories","coupons","banners"].includes(t);
  const exposed = n>0 && !publicOk;
  console.log(`${t.padEnd(16)} ${String(n).padEnd(10)} ${String(count).padEnd(7)} ${exposed?"🚨 YES":(error?"(blocked)":"ok")}`);
}
