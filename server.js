const express = require("express");
const Stripe = require("stripe");
const app = express();
const port = process.env.PORT || 10000;

// STRICT: Only use the environment variable  no fallback, no dummy key
if (!process.env.STRIPE_SECRET_KEY) {
    console.error("FATAL: STRIPE_SECRET_KEY missing from Render environment");
    process.exit(1);
}
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use((req,res,next)=>{
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

// Applestyle carousel (HTML unchanged)
app.get("/", (req, res) => res.send(`...`));  // same HTML you already pushed

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
