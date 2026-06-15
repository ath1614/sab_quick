import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
const env={...process.env};
try{for(const l of fs.readFileSync(".env.local","utf8").split("\n")){if(l.includes("=")&&!l.trim().startsWith("#")){const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!env[k])env[k]=l.slice(i+1).trim();}}}catch{}
const URL=env.NEXT_PUBLIC_SUPABASE_URL, ANON=env.NEXT_PUBLIC_SUPABASE_ANON_KEY, SVC=env.SUPABASE_SERVICE_ROLE_KEY;
const admin=createClient(URL,SVC,{auth:{persistSession:false}});
const PW="Demo@1234";
let pass=0,fail=0; const out=[];
const ok=(c,m)=>{c?pass++:fail++;out.push(`${c?"✅":"❌"} ${m}`);};
async function as(email){const c=createClient(URL,ANON,{auth:{persistSession:false}});const {error}=await c.auth.signInWithPassword({email,password:PW});if(error)throw new Error("login "+email+": "+error.message);return c;}
const E={owner:"demo.owner@sabquick.app",manager:"demo.manager@sabquick.app",staff:"demo.staff@sabquick.app",delivery:"demo.delivery@sabquick.app",customer:"demo.customer@sabquick.app"};
const cleanup={products:[],coupons:[],orders:[]};

try{
  const owner=await as(E.owner), manager=await as(E.manager), staff=await as(E.staff), delivery=await as(E.delivery), customer=await as(E.customer);
  const ids={}; for(const[k,e]of Object.entries(E)){const{data}=await admin.from("users").select("id").eq("email",e).single();ids[k]=data.id;}

  out.push("\n━━━ OWNER ━━━");
  // create coupon
  const code="E2E"+Math.floor(Math.random()*9000+1000);
  const {data:cp,error:cpErr}=await owner.from("coupons").insert({code,type:"percent",value:15,min_order:50,max_discount:100,is_active:true}).select().single();
  ok(!cpErr&&cp,`owner creates coupon ${code} ${cpErr?"ERR "+cpErr.message:""}`); if(cp)cleanup.coupons.push(cp.id);
  // manage users: grant staff a permission
  const {error:upErr}=await owner.from("users").update({permissions:["view_orders","manage_stock","manage_products"]}).eq("id",ids.staff);
  const {data:staffRow}=await admin.from("users").select("permissions").eq("id",ids.staff).single();
  ok(!upErr&&staffRow.permissions?.includes("manage_stock"),`owner grants staff permissions -> ${JSON.stringify(staffRow.permissions)}`);
  // owner adds product
  const {data:cat}=await admin.from("categories").select("id").limit(1).single();
  const {data:opd,error:opErr}=await owner.from("products").insert({name:"Amul Test Milk",description:"t",price:30,mrp:35,unit:"500ml",stock:50,eta_minutes:10,is_active:true,category_id:cat.id}).select().single();
  ok(!opErr&&opd,`owner adds product ${opErr?"ERR "+opErr.message:""}`); if(opd)cleanup.products.push(opd.id);

  out.push("\n━━━ MANAGER ━━━");
  const {data:mpd,error:mpErr}=await manager.from("products").insert({name:"Amul Test Butter",description:"t",price:55,mrp:60,unit:"100g",stock:30,eta_minutes:10,is_active:true,category_id:cat.id}).select().single();
  ok(!mpErr&&mpd,`manager adds product ${mpErr?"ERR "+mpErr.message:""}`); if(mpd)cleanup.products.push(mpd.id);
  if(mpd){const{error:msErr}=await manager.from("products").update({stock:99}).eq("id",mpd.id);const{data:m2}=await admin.from("products").select("stock").eq("id",mpd.id).single();ok(!msErr&&m2.stock===99,`manager updates stock -> ${m2.stock}`);}
  const {data:mOrders}=await manager.from("orders").select("id").limit(5); ok(Array.isArray(mOrders),`manager views orders (${mOrders?.length} visible)`);

  out.push("\n━━━ STAFF ━━━");
  const {data:spd,error:spErr}=await staff.from("products").insert({name:"Staff Test Item",description:"t",price:10,mrp:12,unit:"1pc",stock:5,eta_minutes:10,is_active:true,category_id:cat.id}).select().single();
  ok(!!spd,`staff adds product (expected: should staff be allowed?) ${spErr?"BLOCKED: "+spErr.message:"allowed"}`); if(spd)cleanup.products.push(spd.id);
  if(opd){const{error:ssErr}=await staff.from("products").update({stock:77}).eq("id",opd.id);const{data:s2}=await admin.from("products").select("stock").eq("id",opd.id).single();ok(s2.stock===77,`staff updates stock -> ${s2.stock} (${ssErr?"ERR "+ssErr.message:s2.stock===77?"persisted":"NOT persisted (RLS silently blocked)"})`);}

  out.push("\n━━━ CUSTOMER places order (with coupon) ━━━");
  const {data:prod}=await admin.from("products").select("id,price,stock,name").gt("stock",3).eq("is_active",true).limit(1).single();
  const {data:oid,error:poErr}=await customer.rpc("place_order",{p_items:[{product_id:prod.id,quantity:2}],p_address_line1:"1 Demo St",p_address_city:"Mumbai",p_address_pincode:"400001",p_payment_method:"cod",p_coupon_code:code});
  ok(!poErr&&oid,`customer places order ${poErr?"ERR "+poErr.message:oid}`); if(oid)cleanup.orders.push(oid);
  if(oid){const{data:o}=await admin.from("orders").select("subtotal,discount,total,coupon_code").eq("id",oid).single();
    ok(Number(o.discount)>0,`coupon applied: subtotal ${o.subtotal}, discount ${o.discount}, total ${o.total}, code ${o.coupon_code}`);}
  // customer sees own order on frontend query
  const {data:custOrders}=await customer.from("orders").select("*,order_items(*,products(*))").order("created_at",{ascending:false});
  ok(custOrders?.some(o=>o.id===oid)&&custOrders.every(o=>o.user_id===ids.customer),`customer order history shows only own orders (${custOrders?.length})`);

  out.push("\n━━━ VISIBILITY across roles ━━━");
  const {data:staffSee}=await staff.from("orders").select("id").eq("id",oid); ok(staffSee?.length===1,"staff sees the customer's order");
  const {data:mgrSee}=await manager.from("orders").select("id").eq("id",oid); ok(mgrSee?.length===1,"manager sees the customer's order");
  // owner-added product visible to customer (public)
  const {data:custSeesProd}=await customer.from("products").select("id").eq("id",opd?.id); ok(custSeesProd?.length===1,"owner-added product visible to customer");
  // coupon visible to customer
  const {data:custSeesCoupon}=await customer.from("coupons").select("id").eq("code",code); ok(custSeesCoupon?.length===1,"owner coupon visible to customer");

  out.push("\n━━━ STAFF processes + DELIVERY ━━━");
  if(oid){const{error:e1}=await staff.from("orders").update({status:"accepted"}).eq("id",oid);ok(!e1,"staff accepts order");
    await admin.from("orders").update({delivery_partner_id:ids.delivery,status:"out_for_delivery"}).eq("id",oid);
    const{data:dSee}=await delivery.from("orders").select("id").eq("id",oid);ok(dSee?.length===1,"delivery sees assigned order");
    const{error:e2}=await delivery.from("orders").update({status:"delivered"}).eq("id",oid);ok(!e2,"delivery marks delivered");
    // delivery location broadcast
    const{error:e3}=await delivery.from("delivery_locations").upsert({order_id:oid,partner_id:ids.delivery,lat:19.07,lng:72.87},{onConflict:"order_id"});ok(!e3,"delivery broadcasts GPS location"+(e3?" ERR "+e3.message:""));
    cleanup.orders.push(oid);
  }

  out.push("\n━━━ NEGATIVE checks ━━━");
  const {data:hack}=await customer.from("orders").update({status:"new"}).eq("id",oid).select(); ok(!hack||hack.length===0,"customer CANNOT update order status");
  const {data:custUsers}=await customer.from("users").select("id"); ok(custUsers?.length<=1,`customer CANNOT list all users (sees ${custUsers?.length})`);
  const {error:custCoupon}=await customer.from("coupons").insert({code:"HACK"+Date.now(),type:"flat",value:999,is_active:true}); ok(!!custCoupon,"customer CANNOT create coupons (blocked)");

}catch(e){ok(false,"EXCEPTION: "+e.message);}
finally{
  for(const id of cleanup.orders){await admin.from("delivery_locations").delete().eq("order_id",id);await admin.from("order_items").delete().eq("order_id",id);await admin.from("orders").delete().eq("id",id);}
  for(const id of cleanup.products)await admin.from("products").delete().eq("id",id);
  for(const id of cleanup.coupons)await admin.from("coupons").delete().eq("id",id);
  await admin.from("users").update({permissions:[]}).eq("email",E.staff);
  console.log(out.join("\n"));
  console.log(`\n=== ${pass} passed, ${fail} failed ===`);
}
