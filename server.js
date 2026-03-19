require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// AZURE INTEGRATION: Servir interfaz "en-uno" desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Models setup
const ProductSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    stock: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    date: { type: String },
    priceHistory: [{
        date: String,
        price: Number
    }]
});
const Product = mongoose.model('Product', ProductSchema);

const PurchaseSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    supplier: String,
    subtotal: Number,
    taxPercent: Number,
    taxValue: Number,
    total: Number,
    date: String,
    items: [{
        id: String,
        name: String,
        qty: Number,
        price: Number,
        subtotal: Number
    }]
});
const Purchase = mongoose.model('Purchase', PurchaseSchema);

const TicketSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    concept: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    category: { type: String, default: 'General' },
    image: { type: String }
});
const Ticket = mongoose.model('Ticket', TicketSchema);

// Rutas Integradas API
app.get('/api/products', async (req, res) => {
    try { res.json(await Product.find()); } catch(err) { res.status(500).json({ error: err.message}); }
});

app.post('/api/products', async (req, res) => {
    try { const newProd = new Product(req.body); await newProd.save(); res.json(newProd); } catch(err) { res.status(500).json({ error: err.message}); }
});

app.patch('/api/products/:id', async (req, res) => {
    try { res.json(await Product.findOneAndUpdate({ id: req.params.id }, req.body, { new: true })); } catch(err) { res.status(500).json({ error: err.message}); }
});

app.delete('/api/products', async (req, res) => {
    try { await Product.deleteMany({}); res.json({ message: "Productos vaciados" }); } catch(err) { res.status(500).json({ error: err.message}); }
});

app.get('/api/purchases', async (req, res) => {
    try { res.json(await Purchase.find()); } catch(err) { res.status(500).json({ error: err.message}); }
});

app.post('/api/purchases', async (req, res) => {
    try { const p = new Purchase(req.body); await p.save(); res.json(p); } catch(err) { res.status(500).json({ error: err.message}); }
});

app.delete('/api/purchases', async (req, res) => {
    try { await Purchase.deleteMany({}); res.json({ message: "Compras vaciadas" }); } catch(err) { res.status(500).json({ error: err.message}); }
});

app.get('/api/tickets', async (req, res) => {
    try { res.json(await Ticket.find()); } catch(err) { res.status(500).json({ error: err.message}); }
});

app.post('/api/tickets', async (req, res) => {
    try { const t = new Ticket(req.body); await t.save(); res.json(t); } catch(err) { res.status(500).json({ error: err.message}); }
});

app.delete('/api/tickets/:id', async (req, res) => {
    try { await Ticket.findOneAndDelete({ id: req.params.id }); res.json({ message: "Ticket borrado" }); } catch(err) { res.status(500).json({ error: err.message}); }
});

// Fallback routing para Azure / SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Conexión DB
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.MONGODB_URI;

mongoose.connect(DB_URI).then(() => {
    console.log('Conectado exitosamente a MongoDB Atlas Cloud!');
    app.listen(PORT, () => console.log("Servidor Web+Backend corriendo en el puerto " + PORT));
}).catch(err => console.error('Error Crítico MongoDB:', err));
