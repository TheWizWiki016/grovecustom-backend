const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', async (req, res) => {
    const { auto } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'mxn',
                        product_data: {
                            name: `${auto.marca} ${auto.modelo}`,
                            description: auto.descripcion || 'Auto en venta',
                        },
                        unit_amount: auto.precio * 100,
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.FRONTEND_URL}/autos/exito?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/autos/${auto._id}`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creando sesión:', error);
        res.status(500).json({ error: 'Error al crear la sesión de Stripe' });
    }
});


router.get('/checkout-session', async (req, res) => {
    const sessionId = req.query.session_id

    if (!sessionId) return res.status(400).json({ error: 'No session_id provided' })

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        res.json(session)
    } catch (error) {
        console.error('Error al obtener sesión:', error)
        res.status(500).json({ error: 'Error al obtener sesión' })
    }
})


module.exports = router;
