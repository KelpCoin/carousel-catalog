const express = require("express");
const Stripe = require("stripe");
const app = express();
const port = process.env.PORT || 10000;

let stripe = null;
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn("STRIPE_SECRET_KEY missing  catalog visible, checkout disabled");
    return null;
  }
  if (!stripe) stripe = Stripe(key);
  return stripe;
}

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "frame-ancestors 'self' https://*.notion.site https://*.super.site");
  next();
});
app.use(require("body-parser").json());

const PRODUCTS = [
  { id: "mtg_diagnostic", name: "MTG Deck Diagnostic", price: 2900, gradient: "linear-gradient(135deg, #1a1a2e, #16213e)", tagline: "Three leaks costing you games  fixed in 4 hours" },
  { id: "edh_sliver", name: "Sliver Overlord EDH", price: 14900, gradient: "linear-gradient(135deg, #0f0f1a, #1a1a3e)", tagline: "Fully tuned Commander deck. Ships free." },
  { id: "edh_zombie", name: "Zombie Horde EDH", price: 9900, gradient: "linear-gradient(135deg, #1a1a2e, #0f3460)", tagline: "Relentless recursion. Premium sleeves." },
  { id: "spreadsheet_rescue", name: "Spreadsheet Rescue", price: 9900, gradient: "linear-gradient(135deg, #16213e, #0f3460)", tagline: "Broken formulas? Corrupted file? Fixed in 3h." },
  { id: "banner_design", name: "Custom Banner Design", price: 1500, gradient: "linear-gradient(135deg, #1a1a2e, #533483)", tagline: "YT / Twitch / FB  delivered in 24h" },
  { id: "social_audit", name: "Social Media Audit", price: 2500, gradient: "linear-gradient(135deg, #0f3460, #533483)", tagline: "Growth strategy + profile review" }
];

app.get("/", (req, res) => {
  const ready = !!process.env.STRIPE_SECRET_KEY;
  const productsJson = JSON.stringify(PRODUCTS.map(p => ({
    id: p.id, name: p.name, tagline: p.tagline,
    gradient: p.gradient,
    priceLabel: "$" + (p.price / 100).toFixed(2) + " NZD",
    buyEnabled: ready
  })));
  const trustText = ready ? "Stripe Secure  Instant Delivery  Guaranteed" : "Catalog is live  checkout coming online soon";
  res.send(`<!DOCTYPE html>
<html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>BrownEye Cortex</title>
<style>:root{--bg:#0B0E11;--cardBg:#1E2329;--gold:#F0B90B;--text:#EAECEF;--muted:#848E9C;--radius:14px}*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{background:var(--bg);color:var(--text);font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh}.trust-strip{background:var(--cardBg);border-bottom:1px solid #2B3139;padding:0.6rem 1.5rem;text-align:center;color:var(--muted);font-size:0.8rem;letter-spacing:0.5px}.hero{text-align:center;padding:3rem 1.5rem 2rem}.hero h1{font-size:2.2rem;color:var(--gold);margin-bottom:0.5rem;letter-spacing:-0.5px}.hero p{color:var(--muted);font-size:1rem}.carousel{display:flex;overflow-x:auto;gap:1.2rem;padding:0 1.5rem 2rem;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}.slide{min-width:300px;max-width:340px;scroll-snap-align:center;flex-shrink:0}.card{background:var(--cardBg);border:1px solid #2B3139;border-radius:var(--radius);padding:1.5rem;height:100%;display:flex;flex-direction:column;justify-content:space-between;transition:border-color 0.2s}.card:hover{border-color:var(--gold)}.card:first-of-type{border-color:var(--gold);box-shadow:0 0 24px rgba(240,185,11,0.15)}.layer{font-size:0.7rem;text-transform:uppercase;letter-spacing:1.5px;color:var(--gold);margin-bottom:0.75rem}.card h2{font-size:1.2rem;line-height:1.4;margin-bottom:0.5rem}.tagline{font-size:0.8rem;color:var(--muted);margin-bottom:0.75rem}.price{font-size:1.1rem;color:var(--text);font-weight:600;margin-bottom:1rem}.cta{display:block;background:var(--gold);color:var(--bg);text-align:center;padding:0.75rem;border-radius:8px;font-weight:700;text-decoration:none;margin-top:auto;transition:filter 0.2s}.cta:hover{filter:brightness(1.15)}.cta.disabled{background:#555;color:#999;pointer-events:none}.footer{text-align:center;padding:1.5rem;color:var(--muted);font-size:0.7rem}@media(min-width:768px){.carousel{justify-content:center}}</style></head><body>
<div class="trust-strip">${trustText}</div><div class="hero"><h1>BrownEye Cortex</h1><p>Live probe auction  ranked by real revenue</p></div>
<div class="carousel" id="carousel"></div><div class="footer">Powered by Cortex  Refresh for updated rankings</div>
<script>const PRODUCTS = ${productsJson};const carousel=document.getElementById("carousel");PRODUCTS.forEach((p,i)=>{const s=document.createElement("div");s.className="slide";s.innerHTML='<div class="card"><div class="layer">SIGNAL '+(i===0?'':'')+'</div><h2>'+p.name+'</h2><p class="tagline">'+p.tagline+'</p><p class="price">'+p.priceLabel+'</p><a class="cta'+(p.buyEnabled?'':' disabled')+'" href="'+(p.buyEnabled?'#':'#')+'" '+(p.buyEnabled?'onclick="checkout(\''+p.id+'\');return false;"':'')+'>'+(p.buyEnabled?'Get It Now':'Unavailable')+'</a></div>';carousel.appendChild(s)});function checkout(id){fetch("/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:id})}).then(r=>r.json()).then(d=>{if(d.url)window.location.href=d.url;else alert("Checkout error")}).catch(()=>alert("Checkout error"))}</script></body></html>`);
});

app.post("/checkout", async (req, res) => {
  const stripeClient = getStripe();
  if (!stripeClient) return res.status(503).json({ error: "Payment service not configured." });
  const product = PRODUCTS.find(p => p.id === req.body.productId);
  if (!product) return res.status(400).json({ error: "Invalid product." });
  try {
    const session = await stripeClient.checkout.sessions.create({
      mode: "payment", payment_method_types: ["card"],
      line_items: [{ price_data: { currency: "nzd", product_data: { name: product.name }, unit_amount: product.price }, quantity: 1 }],
      success_url: (process.env.BASE_URL || "https://carousel-catalog.onrender.com") + "/success",
      cancel_url: (process.env.BASE_URL || "https://carousel-catalog.onrender.com"),
      client_reference_id: "cortex_" + Date.now()
    });
    if (!session.url) throw new Error("No URL from Stripe");
    res.json({ url: session.url });
  } catch (e) {
    console.error("STRIPE ERROR:", e);
    res.status(500).json({ error: "stripe_fail", message: e.message });
  }
});

app.get("/success", (req, res) => res.send(`<html><body style="background:#0B0E11;color:#F0B90B;font-family:system-ui;text-align:center;padding:4rem;"><h1>Paid</h1><p>Confirmation email incoming.</p></body></html>`));

app.listen(port, () => console.log("Cortex live :" + port + " checkout " + (!!process.env.STRIPE_SECRET_KEY ? "ENABLED" : "DISABLED")));
