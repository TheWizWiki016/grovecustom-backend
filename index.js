require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const checkoutRoutes = require('./routes/checkout'); // <-- ✅ CORREGIDO

const app = express(); // <-- ✅ MOVIDO ARRIBA
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', checkoutRoutes); // <-- ✅ MOVIDO ABAJO

const categoriasDeLujo = [
    'supercar',
    'hypercar',
    'luxury-sedan',
    'luxury-suv',
    'convertible',
    'coupe-gran-turismo',
    'deportivo-clasico'
];

const categoriasConInfo = [
    { value: 'supercar', label: 'Supercar', color: 'red' },
    { value: 'hypercar', label: 'Hypercar', color: 'purple' },
    { value: 'luxury-sedan', label: 'Sedán de Lujo', color: 'blue' },
    { value: 'luxury-suv', label: 'SUV de Lujo', color: 'green' },
    { value: 'convertible', label: 'Convertible', color: 'yellow' },
    { value: 'coupe-gran-turismo', label: 'Coupé Gran Turismo', color: 'orange' },
    { value: 'deportivo-clasico', label: 'Deportivo Clásico', color: 'indigo' }
];

// Conectar a MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('🟢 Conectado a MongoDB Atlas'))
    .catch(err => console.error('❌ Error MongoDB:', err));

const autoSchema = new mongoose.Schema({
    marca: String,
    modelo: String,
    año: Number,
    precio: Number,
    descripcion: String,

    potencia: String,
    caballosFuerza: Number,
    cilindrada: String,
    tamanoMotor: String,
    tipoCombustible: String,
    transmision: String,
    traccion: String,

    largo: String,
    ancho: String,
    alto: String,
    peso: String,

    imagenes: [String],
    videos: [String],

    categoria: {
        type: String,
        enum: categoriasDeLujo,
        required: true
    }
});

const Auto = mongoose.model('Auto', autoSchema);

app.get('/api/categorias', (req, res) => {
    res.json(categoriasConInfo);
});

// Rutas para autos
app.get('/api/autos', async (req, res) => {
    try {
        const autos = await Auto.find();
        res.json(autos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener autos' });
    }
});

app.post('/api/autos', async (req, res) => {
    try {
        const nuevoAuto = new Auto(req.body);
        const savedAuto = await nuevoAuto.save();
        res.status(201).json(savedAuto);
    } catch (error) {
        res.status(400).json({ error: 'Error al crear auto', detalles: error.message });
    }
});

app.get('/api/autos/:id', async (req, res) => {
    try {
        const auto = await Auto.findById(req.params.id);
        if (!auto) return res.status(404).json({ error: 'Auto no encontrado' });
        res.json(auto);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener auto' });
    }
});

app.put('/api/autos/:id', async (req, res) => {
    try {
        const autoActualizado = await Auto.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!autoActualizado) return res.status(404).json({ error: 'Auto no encontrado' });
        res.json(autoActualizado);
    } catch (error) {
        res.status(400).json({ error: 'Error al actualizar auto' });
    }
});

app.delete('/api/autos/:id', async (req, res) => {
    try {
        const eliminado = await Auto.findByIdAndDelete(req.params.id);
        if (!eliminado) return res.status(404).json({ error: 'Auto no encontrado' });
        res.json({ message: 'Auto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar auto' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
