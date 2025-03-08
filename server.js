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

// Configuração de MIME types
express.static.mime.define({'text/css': ['css']});
express.static.mime.define({'application/javascript': ['js']});

// Arquivos estáticos com configuração de cache e MIME types
app.use(express.static(path.join(__dirname), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
        if (filePath.match(/\.(jpg|jpeg|png|gif|webp|ico)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
    }
}));

// Rotas específicas para arquivos críticos
app.get('/style.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/pixel-loader.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'pixel-loader.js'));
});

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

// Rota para config.js dinâmico
app.get('/quiz/config.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    const configScript = `
        window.config = {
            apiUrl: '${process.env.API_URL || ''}'
        };
        window.dispatchEvent(new Event('config:loaded'));
    `;
    res.send(configScript);
});

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 