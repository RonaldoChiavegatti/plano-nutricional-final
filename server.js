const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3001;

// Configurações de segurança
app.use(helmet({
    contentSecurityPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// CORS
app.use(cors());
app.use(express.json());

// Arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Rotas da API
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API está funcionando!' });
});

app.post('/api/quiz/respostas', (req, res) => {
    const respostas = req.body;
    console.log('Respostas recebidas:', respostas);
    res.json({ 
        success: true, 
        message: 'Respostas salvas com sucesso!'
    });
});

app.get('/api/validate-checkout', (req, res) => {
    const links = {
        '27.00': 'PPU38CPIB8O',
        '39.90': 'PPU38CPIEMR',
        '47.00': 'PPU38CPIEN1'
    };

    const price = req.query.price;
    const checkoutId = links[price];

    if (!checkoutId) {
        res.json({ 
            checkoutUrl: 'https://go.perfectpay.com.br/PPU38CPIB8O'
        });
        return;
    }

    res.json({
        checkoutUrl: `https://go.perfectpay.com.br/${checkoutId}`
    });
});

// Rotas para config.js dinâmico
app.get('/quiz/config.js', (req, res) => {
    const configScript = `
        window.config = {
            apiUrl: '${process.env.API_URL || ''}'
        };
        window.dispatchEvent(new Event('config:loaded'));
    `;
    res.type('application/javascript');
    res.send(configScript);
});

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 