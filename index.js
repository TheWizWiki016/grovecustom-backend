require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5000;

// Configura CORS
const allowedOrigins = [
    'http://localhost:3000',
    'https://grovecustom.vercel.app'
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use(express.json());

// Esquema y modelo para Autos
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

const Auto = mongoose.models.Auto || mongoose.model('Auto', autoSchema);


const comentarioSchema = new mongoose.Schema({
    autoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auto', required: true },
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    contenido: String,
    calificacion: Number,
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comentario', default: null },
    respuestas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comentario' }],
    likes: [String], // lista de userId
    dislikes: [String],
    creadoEn: { type: Date, default: Date.now }
});

const Comentario = mongoose.models.Comentario || mongoose.model('Comentario', comentarioSchema);

// --- Esquema y modelo para Citas ---
const citaSchema = new mongoose.Schema({
    autoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auto', required: true },
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fechaCita: { type: String, required: true },
    horaCita: { type: String, required: true },
    tipoServicio: { type: String, required: true },
    ubicacion: { type: String, required: true },
    direccion: String,
    telefono: { type: String, required: true },
    email: { type: String, required: true },
    comentarios: String,
    esDomicilio: { type: Boolean, default: false },
    concesionarioIndex: { type: Number, default: 0 },
    creadoEn: { type: Date, default: Date.now }
});

const Cita = mongoose.models.Cita || mongoose.model('Cita', citaSchema);

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('🟢 Conectado a MongoDB Atlas'))
    .catch(err => console.error('❌ Error MongoDB:', err));

// Rutas para autos y categorías
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

// Esquema y modelo UNIFICADO para usuarios
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    nombre: String,
    rol: { type: String, default: 'user' }
});

const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', userSchema);

// Ruta POST /api/register
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

// En tu archivo backend (index.js o donde tengas las rutas)

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await Usuario.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Devuelve id en lugar de _id, y conviértelo a string para evitar problemas
        res.json({
            id: user._id.toString(),
            email: user.email,
            nombre: user.nombre,
            rol: user.rol
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en servidor' });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});



// Ruta GET /api/users/:id
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await Usuario.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener usuario', detalles: err.message });
    }
});


// Ruta PUT /api/users/:id
app.put('/api/users/:id', async (req, res) => {
    try {
        const usuarioActualizado = await Usuario.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!usuarioActualizado) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(usuarioActualizado);
    } catch (err) {
        res.status(400).json({ error: 'Error al actualizar usuario', detalles: err.message });
    }
});


app.get('/api/comentarios/:autoId', async (req, res) => {
    try {
        const comentarios = await Comentario.find({
            autoId: req.params.autoId,
            parentId: null
        }).populate('usuarioId', 'nombre')
            .populate({
                path: 'respuestas',
                populate: { path: 'usuarioId', select: 'nombre' }
            });

        res.json(comentarios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener comentarios', detalles: error.message });
    }
});


app.post('/api/comentarios', async (req, res) => {
    console.log("BODY RECIBIDO:", req.body); // Agregado para debug

    try {
        const { autoId, usuarioId, contenido, calificacion, parentId } = req.body;

        // Validaciones básicas
        if (!autoId || !usuarioId || !contenido) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        // Crear el nuevo comentario o respuesta
        const nuevoComentario = new Comentario({
            autoId,
            usuarioId,
            contenido,
            calificacion: calificacion || null,
            parentId: parentId || null
        });

        const comentarioGuardado = await nuevoComentario.save();

        // Si es una respuesta, actualizar el comentario padre
        if (parentId) {
            await Comentario.findByIdAndUpdate(parentId, {
                $push: { respuestas: comentarioGuardado._id }
            });
        }

        // Devuelve el comentario completo (opcionalmente con datos poblados)
        const comentarioCompleto = await Comentario.findById(comentarioGuardado._id)
            .populate('usuarioId', 'nombre email') // si quieres incluir datos del usuario
            .populate('respuestas');

        res.status(201).json(comentarioCompleto);
    } catch (error) {
        console.error('Error al guardar comentario:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.put('/api/comentarios/:id', async (req, res) => {
    try {
        const { contenido, calificacion } = req.body;

        const comentarioActualizado = await Comentario.findByIdAndUpdate(req.params.id, {
            contenido,
            calificacion
        }, { new: true });

        if (!comentarioActualizado) return res.status(404).json({ error: 'Comentario no encontrado' });

        res.json(comentarioActualizado);
    } catch (error) {
        res.status(400).json({ error: 'Error al actualizar comentario', detalles: error.message });
    }
});

// --- Ruta para guardar una cita ---
app.post('/api/citas', async (req, res) => {
    try {
        const {
            autoId,
            usuarioId,
            fechaCita,
            horaCita,
            tipoServicio,
            ubicacion,
            direccion,
            telefono,
            email,
            comentarios,
            esDomicilio,
            concesionarioIndex
        } = req.body;

        // Validación básica
        if (!autoId || !usuarioId || !fechaCita || !horaCita || !tipoServicio || !ubicacion || !telefono || !email) {
            return res.status(400).json({ error: 'Faltan datos requeridos para la cita' });
        }

        const nuevaCita = new Cita({
            autoId,
            usuarioId,
            fechaCita,
            horaCita,
            tipoServicio,
            ubicacion,
            direccion,
            telefono,
            email,
            comentarios,
            esDomicilio,
            concesionarioIndex
        });

        const citaGuardada = await nuevaCita.save();
        res.status(201).json(citaGuardada);
    } catch (error) {
        console.error('Error al guardar la cita:', error); // <--- Esto te dará el error real en consola
        res.status(500).json({ error: 'Error al guardar la cita', detalles: error.message });
    }
});


app.get('/api/citas/usuario/:usuarioId', async (req, res) => {
    try {
        const citas = await Cita.find({ usuarioId: req.params.usuarioId }).populate('autoId');
        res.json(citas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las citas', detalles: error.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-password'); // excluye la contraseña
        res.json(usuarios);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const eliminado = await Usuario.findByIdAndDelete(req.params.id);
        if (!eliminado) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({ message: 'Usuario eliminado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});



// Modelo de venta
const ventaSchema = new mongoose.Schema({
    autoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auto', required: true },
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    monto: Number,
    fecha: { type: Date, default: Date.now },
    estado: { type: String, default: 'completado' }
});

const Venta = mongoose.models.Venta || mongoose.model('Venta', ventaSchema);

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Ruta para crear pago
app.post('/api/pago', async (req, res) => {
    const { autoId, usuarioId, precio } = req.body;
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'mxn',
                    product_data: { name: `Compra de auto: ${autoId}` },
                    unit_amount: precio * 100
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/exito?autoId=${autoId}&usuarioId=${usuarioId}&precio=${precio}`,
            cancel_url: `${process.env.FRONTEND_URL}/autos/${autoId}`
        });
        res.json({ id: session.id });
    } catch (err) {
        res.status(500).json({ error: 'Error creando sesión de Stripe', detalles: err.message });
    }
});

// Ruta para registrar venta (desde success_url)
app.post('/api/ventas', async (req, res) => {
    const { autoId, usuarioId, monto } = req.body;
    try {
        const venta = new Venta({ autoId, usuarioId, monto });
        await venta.save();
        res.status(201).json(venta);
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar venta', detalles: error.message });
    }
});

// Obtener ventas por usuario
app.get('/api/ventas/usuario/:usuarioId', async (req, res) => {
    try {
        const ventas = await Venta.find({ usuarioId: req.params.usuarioId }).populate('autoId');
        res.json(ventas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las ventas', detalles: error.message });
    }
});
