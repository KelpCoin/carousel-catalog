const express = require("express");
const Stripe = require("stripe");
const app = express();
const port = process.env.PORT || 10000;

// ---------- STRIPE: safe init ----------
let stripe = null;
function getStripe() {
    if (stripe) return stripe;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        console.warn("⚠ STRIPE_SECRET_KEY not set – checkout disabled, but catalog is live.");
        return null;
    }
    stripe = Stripe(key);
    return stripe;
}

// ---------- MIDDLEWARE ----------
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy",
        "frame-ancestors 'self' https://*.notion.site https://*.super.site");
    next();
});
app.use(require("body-parser").json());

// ---------- PRODUCT CATALOG ----------
const PRODUCTS = [
    {
        id: "mtg_diagnostic",
        name: "MTG Deck Diagnostic",
        price: 2900,
        image: "https://images.unsplash.com/photo-1613771404721-1f92d6e1e5e1?w=600&h=400&fit=crop",
        tagline: "Pinpoint the 3 leaks costing you games – $29, 4‑hour turnaround"
    },
    {
        id: "edh_sliver",
        name: "Sliver Overlord EDH Deck",
        price: 14900,
        image: "https://images.unsplash.com/photo-1599742482470-8b5a7c91c2e1?w=600&h=400&fit=crop",
        tagline: "Fully tuned Commander deck, ready to dominate. Ships free."
    },
    {
        id: "edh_zombie",
        name: "Zombie Horde EDH Deck",
        price: 9900,
        image: "https://images.unsplash.com/photo-1600796885656-0b0f2a64c0a4?w=600&h=400&fit=crop",
        tagline: "Relentless recursion. Premium sleeves included."
    },
    {
        id: "spreadsheet_rescue",
        name: "Spreadsheet Rescue",
        price: 9900,
        image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
        tagline: "Broken formulas? Corrupted file? Fixed within 3 hours."
    },
    {
        id: "banner_design",
        name: "Custom Banner Design",
        price: 1500,
        image: "https://images.unsplash.com/photo-1561070791-2526d1b8e6a2?w=600&h=400&fit=crop",
        tagline: "YouTube / Twitch / Facebook – delivered in 24h"
    },
    {
        id: "social_audit",
        name: "Social Media Audit",
        price: 2500,
        image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=400&fit=crop",
        tagline: "Growth strategy + profile review – know exactly what to fix"
    }
];

// ---------- FRONTEND (Branson‑meets‑Apple) ----------
app.get("/", (req, res) => {
    const stripeReady = !!process.env.STRIPE_SECRET_KEY;
    const productsJson = JSON.stringify(PRODUCTS.map(p => ({
        ...p,
        priceLabel: `$${(p.price/100).toFixed(2)} NZD`,
        buyEnabled: stripeReady
    })));

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>BrownEye Cortex Store</title>
    <style>
        :root {
            --bg: #0b0b0f;
            --card-bg: rgba(255,255,255,0.06);
            --card-border: rgba(255,255,255,0.10);
            --text: #f5f5f7;
            --sub: #9a9aa3;
            --accent: #0a84ff;
            --accent-hover: #0077ed;
        }
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif;
            background: radial-gradient(1200px 800px at 50% -20%, rgba(10,132,255,0.25), transparent 60%),
                        radial-gradient(900px 600px at 80% 120%, rgba(120,120,255,0.10), transparent 60%),
                        var(--bg);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            -webkit-font-smoothing: antialiased;
            overflow-x: hidden;
        }
        .header {
            padding: 48px 32px 12px;
            font-size: 32px;
            font-weight: 600;
            letter-spacing: -0.5px;
            text-align: center;
        }
        .subheader {
            padding: 0 32px 32px;
            color: var(--sub);
            font-size: 15px;
            text-align: center;
            max-width: 600px;
        }
        .carousel {
            display: flex;
            gap: 28px;
            padding: 40px 32px 60px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            scroll-behavior: smooth;
            width: 100%;
            max-width: 1200px;
        }
        .carousel::-webkit-scrollbar { display: none; }
        .card {
            flex: 0 0 340px;
            border-radius: 28px;
            scroll-snap-align: center;
            background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
            border: 1px solid var(--card-border);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            transition: transform 0.4s cubic-bezier(0.2, 0.9, 0.4, 1), box-shadow 0.4s;
        }
        .card:hover {
            transform: translateY(-6px);
            box-shadow: 0 30px 60px rgba(0,0,0,0.7);
        }
        .card-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-bottom: 1px solid var(--card-border);
        }
        .card-body {
            padding: 24px;
            display: flex;
            flex-direction: column;
            flex: 1;
        }
        .card-title {
            font-size: 22px;
            font-weight: 600;
            letter-spacing: -0.3px;
            margin-bottom: 6px;
        }
        .card-tagline {
            font-size: 14px;
            color: var(--sub);
            margin-bottom: 16px;
            line-height: 1.4;
            flex: 1;
        }
        .card-price {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        .buy-btn {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 999px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            background: var(--accent);
            color: white;
            transition: all 0.2s ease;
            letter-spacing: -0.2px;
        }
        .buy-btn:hover:not(:disabled) {
            background: var(--accent-hover);
            transform: scale(1.02);
        }
        .buy-btn:active:not(:disabled) {
            transform: scale(0.98);
        }
        .buy-btn:disabled {
            background: #555;
            cursor: not-allowed;
            opacity: 0.7;
        }
        .trust-badges {
            display: flex;
            justify-content: center;
            gap: 24px;
            margin-top: 12px;
            font-size: 13px;
            color: var(--sub);
        }
        .footer {
            padding: 24px;
            font-size: 12px;
            color: var(--sub);
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">BrownEye Cortex</div>
    <div class="subheader">
        ${stripeReady 
            ? "Instant checkout. Secure delivery. Satisfaction guaranteed." 
            : "Our catalog is live. Checkout will be available shortly."}
    </div>
    <div class="carousel" id="carousel"></div>
    <div class="trust-badges">
        <span>🔒 Stripe Secure</span>
        <span>⚡ Instant Delivery</span>
        <span>🛡️ Money‑Back Guarantee</span>
    </div>
    <div class="footer">© BrownEye Cortex – All transactions encrypted & protected</div>

    <script>
        const PRODUCTS = ${productsJson};
        const carousel = document.getElementById('carousel');

        PRODUCTS.forEach((product, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img class="card-image" src="${product.image}" alt="${product.name}" loading="lazy">
                <div class="card-body">
                    <div class="card-title">${product.name}</div>
                    <div class="card-tagline">${product.tagline}</div>
                    <div class="card-price">${product.priceLabel}</div>
                    <button class="buy-btn" data-product-id="${product.id}"
                        ${product.buyEnabled ? '' : 'disabled'}>
                        ${product.buyEnabled ? 'Buy Now' : 'Coming Soon'}
                    </button>
                </div>
            `;
            carousel.appendChild(card);
        });

        // ----- Checkout Logic -----
        document.addEventListener('click', async (e) => {
            const btn = e.target.closest('.buy-btn');
            if (!btn || btn.disabled) return;
            e.preventDefault();
            const productId = btn.dataset.productId;
            try {
                const res = await fetch('/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId })
                });
                const data = await res.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    alert(data.error || 'Checkout unavailable. Please try again later.');
                }
            } catch (err) {
                alert('Unable to connect to payment server. Check back soon.');
            }
        });
    </script>
</body>
</html>`);
});

// ---------- CHECKOUT (only active when Stripe key exists) ----------
app.post("/checkout", async (req, res) => {
    const stripeClient = getStripe();
    if (!stripeClient) {
        return res.status(503).json({ error: "Payment service not configured yet." });
    }

    const product = PRODUCTS.find(p => p.id === req.body.productId);
    if (!product) {
        return res.status(400).json({ error: "Invalid product selected." });
    }

    const ref = "cortex_" + Date.now();
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
            client_reference_id: ref
        }, { idempotencyKey: ref });
        res.json({ url: session.url, ref });
    } catch (err) {
        console.error("Checkout error:", err);
        res.status(500).json({ error: "Payment failed. Please try again." });
    }
});

// ---------- SUCCESS PAGE ----------
app.get("/success", (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Payment Confirmed</title>
<style>body{font-family:-apple-system,sans-serif;display:flex;height:100vh;align-items:center;justify-content:center;background:#0b0b0f;color:#f5f5f7;margin:0}.card{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:28px;padding:3rem;text-align:center;backdrop-filter:blur(14px);}.card h1{font-size:2rem;margin-bottom:0.5rem}.card p{color:#9a9aa3}</style></head>
<body><div class="card"><h1>✅ Payment Successful</h1><p>Thank you! You’ll receive your order confirmation shortly.</p></div></body>
</html>`);
});

// ---------- START ----------
app.listen(port, () => {
    console.log(`🚀 BrownEye Cortex storefront running on port ${port}`);
    if (!process.env.STRIPE_SECRET_KEY) {
        console.warn("💡 STRIPE_SECRET_KEY not set – catalog visible, checkout disabled.");
    }
});