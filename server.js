const express = require("express");
const Stripe = require("stripe");
const app = express();
const port = process.env.PORT || 10000;

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy",
        "frame-ancestors 'self' https://*.notion.site https://*.super.site https://super.site");
    next();
});
app.use(require("body-parser").json());

const PRODUCTS = [
    { id:"offer1", name:"Month-End Close Acceleration Kit", price:4900 },
    { id:"offer2", name:"SOC2 Evidence Pack", price:9700 },
    { id:"offer3", name:"Automation Audit Diagnostic", price:19700 }
];

app.get("/", (req, res) => res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    body{margin:0;font-family:Arial;background:#111;color:white}
    .carousel{display:flex;overflow-x:scroll;scroll-snap-type:x mandatory}
    .card{min-width:90%;margin:5%;background:#222;border-radius:12px;padding:20px;scroll-snap-align:center}
    button{width:100%;margin-top:15px;padding:12px;background:#00ff88;border:none;border-radius:8px;font-size:16px;cursor:pointer}
</style>
</head>
<body>
<div class="carousel">
${PRODUCTS.map(p => `
<div class="card">
    <h2>${p.name}</h2>
    <p>$${(p.price/100).toFixed(2)}</p>
    <button onclick="buy('${p.id}')">Buy Now</button>
</div>
`).join("")}
</div>
<script>
async function buy(productId){
    const r = await fetch('/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId})});
    const d = await r.json();
    window.location = d.url;
}
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
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [{
                price_data: {
                    currency: "usd",
                    product_data: { name: product.name },
                    unit_amount: product.price
                },
                quantity: 1
            }],
            success_url: (process.env.BASE_URL||"https://carousel-catalog.onrender.com") + "/success",
            cancel_url: (process.env.BASE_URL||"https://carousel-catalog.onrender.com"),
            client_reference_id: ref
        }, { idempotencyKey: ref });
        res.json({ url: session.url, ref });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "stripe_fail" });
    }
});

app.get("/success", (req, res) => res.send("Payment successful "));
app.listen(port, () => console.log("Carousel live on port " + port));


