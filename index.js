require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;


// Configura CORS con orígenes permitidos
const allowedOrigins = [
    'http://localhost:3000', // para desarrollo local
    'https://grovecustom.vercel.app' // para producción si usas Vercel
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true, // si usas cookies o headers de autenticación
}));

app.use(express.json()); // 👈 ESTO ES LO QUE FALTABA


// Tu esquema y modelo de Auto (igual que antes)
const categoriasDeLujo = [
    'supercar',
    'hypercar',
    'luxury-sedan',
    'luxury-suv',
    'convertible',
    'coupe-gran-turismo',
    'deportivo-clasico'
];

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

// Conectar MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('🟢 Conectado a MongoDB Atlas'))
    .catch(err => console.error('❌ Error MongoDB:', err));



// Rutas autos (igual que antes)
app.get('/api/categorias', (req, res) => {
    res.json([
        { value: 'supercar', label: 'Supercar', color: 'red' },
        { value: 'hypercar', label: 'Hypercar', color: 'purple' },
        { value: 'luxury-sedan', label: 'Sedán de Lujo', color: 'blue' },
        { value: 'luxury-suv', label: 'SUV de Lujo', color: 'green' },
        { value: 'convertible', label: 'Convertible', color: 'yellow' },
        { value: 'coupe-gran-turismo', label: 'Coupé Gran Turismo', color: 'orange' },
        { value: 'deportivo-clasico', label: 'Deportivo Clásico', color: 'indigo' }
    ]);
});

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



// ------------------------------------------------

const loginUserSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    name: String,
});

const User = mongoose.model('Usuario', loginUserSchema);

// Ruta POST /api/login para validar usuario
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        // Para demo simple: comparar texto plano (mejor usar bcrypt en producción)
        if (user.password !== password) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Si todo bien, devolver datos usuario (sin password)
        const { _id, email: userEmail, name } = user;
        res.json({ id: _id, email: userEmail, name });
    } catch (error) {
        res.status(500).json({ error: 'Error en servidor' });
    }
});


// ------------------------------------------------

const bcrypt = require('bcrypt');

// Simulación de modelo de Usuario (ajusta a tu esquema real o crea uno aparte)
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    nombre: String,
    rol: { type: String, default: 'user' }
});

const Usuario = mongoose.model('Usuario', userSchema);

// Ruta de registro
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, nombre } = req.body;

        if (!email || !password || !nombre) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const nuevoUsuario = new Usuario({
            email,
            password: hashedPassword,
            nombre
        });

        await nuevoUsuario.save();

        res.status(201).json({ message: 'Usuario registrado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar usuario', detalles: error.message });
    }
});

