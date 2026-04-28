const express = require("express");
const Stripe = require("stripe");
const app = express();
const port = process.env.PORT || 10000;
if (!process.env.STRIPE_SECRET_KEY) { console.warn("No Stripe key - UI only"); process.env.STRIPE_SECRET_KEY = "sk_dummy"; }
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use((req,res,next)=>{res.setHeader("Content-Security-Policy","frame-ancestors 'self' https://*.notion.site https://*.super.site");next();});
app.use(require("body-parser").json());

const PRODUCTS = [
    { id:"mtg_diagnostic", name:"MTG Deck Diagnostic", price:2900 },
    { id:"edh_sliver", name:"Sliver Overlord EDH Deck", price:14900 },
    { id:"edh_zombie", name:"Zombie Horde EDH Deck", price:9900 },
    { id:"spreadsheet_rescue", name:"Spreadsheet Rescue", price:9900 },
    { id:"digital_sku1", name:"Custom Banner Design", price:1500 },
    { id:"digital_sku2", name:"Social Media Audit", price:2500 }
];

app.get("/", (req, res) => res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
:root{ --bg:#0b0b0f; --card:rgba(255,255,255,0.06); --cardBorder:rgba(255,255,255,0.10); --text:#f5f5f7; --sub:#9a9aa3; --accent:#0a84ff; }
body{ margin:0; font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif; background:radial-gradient(1200px 800px at 50% -20%, rgba(10,132,255,0.25), transparent 60%), radial-gradient(900px 600px at 80% 120%, rgba(120,120,255,0.10), transparent 60%), var(--bg); color:var(--text); -webkit-font-smoothing:antialiased; overflow-x:hidden; }
.header{ padding:40px 40px 10px; font-size:28px; font-weight:600; letter-spacing:-0.5px; }
.subheader{ padding:0 40px 20px; color:var(--sub); font-size:14px; }
.carousel{ display:flex; gap:28px; padding:40px; overflow-x:auto; scroll-snap-type:x mandatory; scroll-behavior:smooth; }
.carousel::-webkit-scrollbar{ display:none; }
.card{ flex:0 0 340px; height:440px; padding:28px; border-radius:28px; scroll-snap-align:center; background:linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)); border:1px solid var(--cardBorder); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); display:flex; flex-direction:column; justify-content:space-between; transform:scale(0.96); opacity:0.6; transition:transform .45s cubic-bezier(.2,.8,.2,1), opacity .45s ease, box-shadow .45s ease; box-shadow:0 10px 30px rgba(0,0,0,0.35); }
.card.active{ transform:scale(1.04); opacity:1; box-shadow:0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08); }
h2{ font-size:20px; font-weight:600; margin:0; letter-spacing:-0.3px; }
.price{ font-size:30px; font-weight:600; margin-top:10px; }
.meta{ color:var(--sub); font-size:13px; margin-top:6px; }
button{ margin-top:24px; padding:14px; border-radius:999px; border:none; font-size:15px; font-weight:600; cursor:pointer; background:var(--accent); color:white; transition:transform .2s ease, filter .2s ease; }
button:hover{ transform:scale(1.03); filter:brightness(1.1); }
button:active{ transform:scale(0.97); }
</style>
</head>
<body>
<div class="header">Catalog</div>
<div class="subheader">Smooth checkout. Zero friction. Fast intent-to-pay flow.</div>
<div class="carousel" id="carousel">
${PRODUCTS.map(p => `
<div class="card">
    <div>
        <h2>${p.name}</h2>
        <div class="price">$${(p.price/100).toFixed(2)}</div>
        <div class="meta">Instant delivery  Secure Stripe checkout</div>
    </div>
    <button onclick="buy('${p.id}')">Buy</button>
</div>
`).join("")}
</div>
<script>
async function buy(productId){ const r = await fetch('/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId})}); const d = await r.json(); window.location = d.url; }
const cards = document.querySelectorAll('.card');
const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if(entry.isIntersecting){ cards.forEach(c => c.classList.remove('active')); entry.target.classList.add('active'); } }); }, { root: document.querySelector('.carousel'), threshold: 0.6 });
cards.forEach(card => observer.observe(card));
</script>
</body>
</html>
`));

app.post("/checkout", async (req, res) => {
    const product = PRODUCTS.find(p => p.id === req.body.productId);
    if (!product) return res.status(400).json({error:"invalid product"});
    const ref = "cortex_" + Date.now();
    try {
        const session = await stripe.checkout.sessions.create({
            mode: "payment", payment_method_types: ["card"],
            line_items: [{ price_data: { currency: "usd", product_data: { name: product.name }, unit_amount: product.price }, quantity: 1 }],
            success_url: (process.env.BASE_URL||"https://carousel-catalog.onrender.com") + "/success",
            cancel_url: (process.env.BASE_URL||"https://carousel-catalog.onrender.com"),
            client_reference_id: ref
        }, { idempotencyKey: ref });
        res.json({ url: session.url, ref });
    } catch (err) { console.error(err); res.status(500).json({ error: "stripe_fail" }); }
});

app.get("/success", (req, res) => res.send("Payment successful "));
app.listen(port, () => console.log("Carousel live on port " + port));
