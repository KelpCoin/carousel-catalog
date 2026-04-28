const express = require("express");
const Stripe = require("stripe");
const app = express();
const port = process.env.PORT || 10000;

// --------------- STRIPE (always safe) ---------------
let stripe = null;
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn(" STRIPE_SECRET_KEY missing  catalog visible, checkout disabled");
    return null;
  }
  if (!stripe) stripe = Stripe(key);
  return stripe;
}

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy",
    "frame-ancestors 'self' https://*.notion.site https://*.super.site");
  next();
});
app.use(require("body-parser").json());

// --------------- PRODUCTS (gradient-only, zero AI slop) ---------------
const PRODUCTS = [
  {
    id: "mtg_diagnostic",
    name: "MTG Deck Diagnostic",
    price: 2900,
    gradient: "linear-gradient(135deg, #1a1a2e, #16213e)",
    tagline: "Three leaks costing you games  fixed in 4 hours"
  },
  {
    id: "edh_sliver",
    name: "Sliver Overlord EDH",
    price: 14900,
    gradient: "linear-gradient(135deg, #0f0f1a, #1a1a3e)",
    tagline: "Fully tuned Commander deck. Ships free."
  },
  {
    id: "edh_zombie",
    name: "Zombie Horde EDH",
    price: 9900,
    gradient: "linear-gradient(135deg, #1a1a2e, #0f3460)",
    tagline: "Relentless recursion. Premium sleeves."
  },
  {
    id: "spreadsheet_rescue",
    name: "Spreadsheet Rescue",
    price: 9900,
    gradient: "linear-gradient(135deg, #16213e, #0f3460)",
    tagline: "Broken formulas? Corrupted file? Fixed in 3h."
  },
  {
    id: "banner_design",
    name: "Custom Banner Design",
    price: 1500,
    gradient: "linear-gradient(135deg, #1a1a2e, #533483)",
    tagline: "YT / Twitch / FB  delivered in 24h"
  },
  {
    id: "social_audit",
    name: "Social Media Audit",
    price: 2500,
    gradient: "linear-gradient(135deg, #0f3460, #533483)",
    tagline: "Growth strategy + profile review"
  }
];

// --------------- FRONTEND (Apple-dark, glass, kinetic scroll) ---------------
app.get("/", (req, res) => {
  const ready = !!process.env.STRIPE_SECRET_KEY;

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>BrownEye Cortex</title>
<style>
  :root {
    --bg: #0a0a0b;
    --card-shadow: 0 25px 50px -12px rgba(0,0,0,0.6);
    --text: #f5f5f7;
    --sub: #98989d;
    --accent: #0a84ff;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  .header {
    padding: 56px 32px 8px;
    font-size: 34px;
    font-weight: 600;
    letter-spacing: -0.6px;
    text-align: center;
  }
  .sub {
    padding: 0 32px 36px;
    color: var(--sub);
    font-size: 15px;
    text-align: center;
  }
  .carousel {
    display: flex;
    gap: 28px;
    padding: 0 32px 50px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    width: 100%;
    max-width: 1200px;
  }
  .carousel::-webkit-scrollbar { display: none; }
  .card {
    flex: 0 0 320px;
    height: 440px;
    border-radius: 32px;
    scroll-snap-align: center;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 32px 28px;
    box-shadow: var(--card-shadow);
    transition: transform 0.45s cubic-bezier(0.2,0.9,0.4,1), box-shadow 0.45s;
    position: relative;
    overflow: hidden;
  }
  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: inherit;
    opacity: 0.25;
    z-index: 0;
  }
  .card > * { position: relative; z-index: 1; }
  .card:hover {
    transform: translateY(-8px);
    box-shadow: 0 35px 65px rgba(0,0,0,0.8);
  }
  .name {
    font-size: 24px;
    font-weight: 600;
    letter-spacing: -0.4px;
    line-height: 1.2;
    margin-bottom: 6px;
  }
  .tagline {
    font-size: 14px;
    color: var(--sub);
    margin-bottom: 24px;
    line-height: 1.4;
  }
  .price {
    font-size: 36px;
    font-weight: 600;
    letter-spacing: -0.5px;
    margin-bottom: 28px;
  }
  .btn {
    width: 100%;
    padding: 15px;
    border-radius: 30px;
    border: none;
    font-size: 16px;
    font-weight: 590;
    cursor: pointer;
    background: var(--accent);
    color: white;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    letter-spacing: -0.2px;
  }
  .btn:hover:not(:disabled) { background: #0077ed; transform: scale(1.02); }
  .btn:active:not(:disabled) { transform: scale(0.98); }
  .btn:disabled { background: #3a3a3c; cursor: not-allowed; }
  .trust {
    display: flex;
    justify-content: center;
    gap: 28px;
    margin: 8px 0 24px;
    font-size: 13px;
    color: var(--sub);
  }
  .footer {
    padding: 0 0 28px;
    font-size: 12px;
    color: #6e6e73;
  }
</style>
</head>
<body>
<div class="header">BrownEye Cortex</div>
<div class="sub">${ready ? "Instant checkout  Secure delivery" : "Catalog is live  checkout coming online soon"}</div>
<div class="carousel" id="carousel"></div>
<div class="trust"><span> Stripe Secure</span><span> Instant Delivery</span><span> Guaranteed</span></div>
<div class="footer"> BrownEye Cortex</div>

<script>
  const DATA = ${JSON.stringify(PRODUCTS.map(p => ({
    id: p.id, name: p.name, price: p.price, tagline: p.tagline, gradient: p.gradient,
    priceLabel: " $" + (p.price/100).toFixed(2) + " NZD",
    buyEnabled: ${ready}
  })))};

  const carousel = document.getElementById("carousel");
  DATA.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.background = p.gradient;
    card.innerHTML = '<div class="name">' + p.name + '</div>' +
                    '<div class="tagline">' + p.tagline + '</div>' +
                    '<div class="price">' + p.priceLabel + '</div>' +
                    '<button class="btn" data-pid="' + p.id + '"' + (p.buyEnabled ? '' : ' disabled') + '>' +
                    (p.buyEnabled ? 'Buy Now' : 'Coming Soon') + '</button>';
    carousel.appendChild(card);
  });

  async function buy(productId) {
    const btn = document.querySelector('.btn[data-pid="' + productId + '"]');
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    btn.textContent = "Preparing";
    try {
      const r = await fetch("/checkout", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({productId})
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || d.error || "Unknown");
      if (!d.url) throw new Error("No checkout URL");
      window.location.href = d.url;
    } catch(e) {
      alert("Checkout failed: " + e.message);
      console.error(e);
    } finally {
      btn.disabled = false;
      btn.textContent = "Buy Now";
    }
  }

  document.addEventListener("click", e => {
    const btn = e.target.closest(".btn");
    if (!btn || btn.disabled) return;
    e.preventDefault();
    buy(btn.dataset.pid);
  });
</script>
</body>
</html>`);
});

// --------------- CHECKOUT (observable, never undefined) ---------------
app.post("/checkout", async (req, res) => {
  const stripeClient = getStripe();
  if (!stripeClient) return res.status(503).json({ error: "Payment service not configured." });

  const product = PRODUCTS.find(p => p.id === req.body.productId);
  if (!product) return res.status(400).json({ error: "Invalid product." });

  try {
    const session = await stripeClient.checkout.sessions.create({
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

app.get("/success", (req, res) => res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Paid</title><style>body{font-family:-apple-system,sans-serif;background:#0a0a0b;color:#f5f5f7;display:flex;height:100vh;align-items:center;justify-content:center;margin:0}.card{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:28px;padding:3rem;text-align:center;backdrop-filter:blur(14px)}h1{font-size:2rem;margin-bottom:.5rem}p{color:#98989d}</style></head><body><div class="card"><h1> Paid</h1><p>Confirmation email incoming.</p></div></body></html>`));

app.listen(port, () => console.log("Cortex live :" + port + "  checkout " + (process.env.STRIPE_SECRET_KEY ? "ENABLED" : "DISABLED")));
