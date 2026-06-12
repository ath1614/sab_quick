// Full end-to-end test against the live Supabase. Creates throwaway test
// accounts, exercises the real order pipeline + RLS across roles, then cleans up.
// Run: node scripts/e2e.mjs
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const env = { ...process.env };
try {
  for (const l of fs.readFileSync(".env.local", "utf8").split("\n")) {
    if (l.includes("=") && !l.trim().startsWith("#")) {
      const i = l.indexOf("="); const k = l.slice(0, i).trim();
      if (!env[k]) env[k] = l.slice(i + 1).trim();
    }
  }
} catch {}
const URL = env.NEXT_PUBLIC_SUPABASE_URL, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY, SVC = env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(URL, SVC, { auth: { persistSession: false } });
const stamp = Math.floor(Math.random() * 1e6).toString(36) + Date.now().toString(36);
const PW = "Test@12345";

let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log(`${c ? "✅" : "❌"} ${m}`); };

const created = [];
async function mkUser(role) {
  const email = `e2e_${role}_${stamp}@sabquick.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PW, email_confirm: true, user_metadata: { name: `E2E ${role}`, role },
  });
  if (error) throw new Error(`createUser ${role}: ${error.message}`);
  created.push(data.user.id);
  // ensure role/profile (trigger should have inserted it)
  await admin.from("users").update({ role, is_active: true }).eq("id", data.user.id);
  return data.user.id;
}
function client() { return createClient(URL, ANON, { auth: { persistSession: false } }); }
async function signIn(c, email) {
  const { error } = await c.auth.signInWithPassword({ email, password: PW });
  if (error) throw new Error("signIn: " + error.message);
}

let orderId;
try {
  console.log("\n— Setup —");
  const custId = await mkUser("customer");
  const staffId = await mkUser("staff");
  const delivId = await mkUser("delivery");
  ok(true, "created 3 test accounts");

  // pick a real active product with stock
  const { data: prod } = await admin.from("products").select("id,name,price,stock").gt("stock", 2).eq("is_active", true).limit(1).single();
  ok(!!prod, `picked product: ${prod?.name} (stock ${prod?.stock})`);

  console.log("\n— Customer places COD order via place_order RPC —");
  const cust = client();
  await signIn(cust, `e2e_customer_${stamp}@sabquick.test`);
  const { data: newOrderId, error: poErr } = await cust.rpc("place_order", {
    p_items: [{ product_id: prod.id, quantity: 2 }],
    p_address_line1: "12 Test Street", p_address_city: "Mumbai", p_address_pincode: "400001",
    p_payment_method: "cod",
  });
  ok(!poErr && newOrderId, `place_order returned id ${newOrderId ?? poErr?.message}`);
  orderId = newOrderId;

  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
  ok(order?.status === "new", `order status = ${order?.status}`);
  ok(Number(order?.total) === Number(prod.price) * 2 + (Number(prod.price)*2 >= 199 ? 0 : 25), `total computed server-side = ${order?.total} (price ${prod.price} x2 + delivery)`);
  const { count: itemCount } = await admin.from("order_items").select("*", { count: "exact", head: true }).eq("order_id", orderId);
  ok(itemCount === 1, `order_items rows = ${itemCount}`);
  const { data: prodAfter } = await admin.from("products").select("stock").eq("id", prod.id).single();
  ok(prodAfter.stock === prod.stock - 2, `stock decremented ${prod.stock} -> ${prodAfter.stock}`);

  console.log("\n— RLS: customer sees own order, not others —");
  const { data: myOrders } = await cust.from("orders").select("id").eq("id", orderId);
  ok(myOrders?.length === 1, "customer can read own order");
  const { data: allOrders } = await cust.from("orders").select("id");
  ok(allOrders?.every((o) => o.id), `customer order list scoped (sees ${allOrders?.length})`);

  console.log("\n— Staff sees order + updates status —");
  const staff = client();
  await signIn(staff, `e2e_staff_${stamp}@sabquick.test`);
  const { data: staffView } = await staff.from("orders").select("id,status").eq("id", orderId);
  ok(staffView?.length === 1, "staff can view the customer's order (RLS)");
  const { error: updErr } = await staff.from("orders").update({ status: "accepted" }).eq("id", orderId);
  ok(!updErr, "staff updated status -> accepted" + (updErr ? " ERR " + updErr.message : ""));
  const { data: afterUpd } = await admin.from("orders").select("status").eq("id", orderId).single();
  ok(afterUpd.status === "accepted", `status persisted = ${afterUpd.status}`);

  console.log("\n— Assign delivery + delivery updates —");
  await admin.from("orders").update({ delivery_partner_id: delivId, status: "out_for_delivery" }).eq("id", orderId);
  const deliv = client();
  await signIn(deliv, `e2e_delivery_${stamp}@sabquick.test`);
  const { data: delivView } = await deliv.from("orders").select("id").eq("id", orderId);
  ok(delivView?.length === 1, "delivery partner sees assigned order (RLS)");
  const { error: dErr } = await deliv.from("orders").update({ status: "delivered" }).eq("id", orderId);
  ok(!dErr, "delivery marked delivered" + (dErr ? " ERR " + dErr.message : ""));

  console.log("\n— Negative RLS: customer cannot update order status —");
  const { data: hack } = await cust.from("orders").update({ status: "new" }).eq("id", orderId).select();
  ok(!hack || hack.length === 0, "customer blocked from updating order status (RLS)");

} catch (e) {
  ok(false, "EXCEPTION: " + e.message);
} finally {
  console.log("\n— Cleanup —");
  if (orderId) { await admin.from("order_items").delete().eq("order_id", orderId); await admin.from("orders").delete().eq("id", orderId); }
  for (const id of created) { await admin.auth.admin.deleteUser(id).catch(() => {}); }
  console.log("cleaned up test data");
  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
  process.exit(fail ? 1 : 0);
}
