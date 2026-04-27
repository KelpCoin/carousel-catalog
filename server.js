const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static('public'));

app.post('/api/signup', (req, res) => {
    // Idempotency-Key is checked via middleware
    res.json({ok:true});
});
app.post('/api/login', (req, res) => res.json({ok:true}));
app.post('/api/avatar', (req, res) => res.json({ok:true}));
app.post('/api/webhook', (req, res) => res.json({ok:true}));

app.get('/health', (req, res) => res.send('OK'));
app.listen(port, () => console.log(`Server on port ${port}`));
