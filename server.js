const express = require("express");
const Stripe = require("stripe");
const app = express();
const port = process.env.PORT || 10000;

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error("FATAL: STRIPE_SECRET_KEY missing");
  process.exit(1);
}
const stripe = Stripe(stripeKey);

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy","frame-ancestors 'self' https://*.notion.site https://*.super.site");
  next();
});
app.use(require("body-parser").json());

const PRODUCTS = [
  { id:"mtg_diagnostic", name:"MTG Deck Diagnostic", price:2900 },
  { id:"edh_sliver", name:"Sliver Overlord EDH Deck", price:14900 },
  { id:"edh_zombie", name:"Zombie Horde EDH Deck", price:9900 },
  { id:"spreadsheet_rescue", name:"Spreadsheet Rescue", price:9900 },
  { id:"banner_design", name:"Custom Banner Design", price:1500 },
  { id:"social_audit", name:"Social Media Audit", price:2500 }
];

app.get("/", (req, res) => res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#0b0b0f;color:#f5f5f7}
  .carousel{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:20px;padding:40px 20px}
  .card{min-width:300px;scroll-snap-align:center;background:linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03));border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:20px;display:flex;flex-direction:column;justify-content:space-between}
  .card h2{font-size:1.2rem;margin:0 0 4px}
  .card .price{font-size:2rem;font-weight:bold;margin:10px 0}
  .card button{background:#0a84ff;border:none;border-radius:999px;color:#fff;font-size:1rem;padding:12px;cursor:pointer}
</style>
</head>
<body>
<div class="carousel">
${PRODUCTS.map(p => `
  <div class="card">
    <div>
      <h2>${p.name}</h2>
      <p>Instant delivery  Secure Stripe</p>
      <div class="price">$${(p.price/100).toFixed(2)} NZD</div>
    </div>
    <button onclick="buy('${p.id}')">Buy Now</button>
  </div>
`).join("")}
</div>
<script>
async function buy(productId){
  const res = await fetch('/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId})});
  const data = await res.json();
  window.location = data.url;
}
</script>
</body>
</html>`));

app.post("/checkout", async (req, res) => {
  const product = PRODUCTS.find(p => p.id === req.body.productId);
  if (!product) return res.status(400).json({error:"invalid product"});
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "nzd",
          product_data: { name: product.name },
          unit_amount: product.price
        },
        quantity: 1
      }],
      success_url: process.env.BASE_URL + "/success",
      cancel_url: process.env.BASE_URL
    });
    res.json({ url: session.url });
  } catch(e) {
    res.status(500).json({ error: "stripe_fail" });
  }
});

app.get("/success", (req, res) => res.send("<h1>Payment successful</h1>"));
app.listen(port, () => console.log("Carousel running on port " + port));
