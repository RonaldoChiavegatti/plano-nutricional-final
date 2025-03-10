const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configurações de segurança
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://go.perfectpay.com.br', 'https://connect.facebook.net'],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:', 'https://www.facebook.com'],
            connectSrc: ["'self'", 'https://go.perfectpay.com.br', 'https://www.facebook.com'],
            frameSrc: ["'self'", 'https://go.perfectpay.com.br'],
            formAction: ["'self'", 'https://go.perfectpay.com.br']
        }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" }
}));

// Compressão GZIP
app.use(compression());

// Proteção contra Parameter Pollution
app.use(hpp());

// Sanitização de dados
app.use(mongoSanitize());

// Rate limiting global - mais permissivo para recursos gerais
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // aumentado para 1000 requisições
    message: 'Muitas requisições deste IP, por favor tente novamente em 15 minutos',
    skip: (req) => {
        // Ignora arquivos estáticos e recursos do Facebook Pixel
        return req.path.match(/\.(js|css|png|jpg|jpeg|gif|webp|ico)$/) ||
               req.path.includes('fbevents') ||
               req.path.includes('facebook');
    }
});

// Rate limiting específico para API - mantém mais restrito
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // aumentado para 100 requisições
    message: 'Limite de requisições da API excedido'
});

// Aplica rate limiting apenas em rotas específicas
app.use('/api/', apiLimiter);
app.use(['/quiz/respostas', '/quiz/config.js'], limiter); // aplica apenas em endpoints específicos

// CORS
const corsOptions = {
    origin: [
        'https://queimadefinitiva.shop',
        'https://www.queimadefinitiva.shop'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Configuração de MIME types e arquivos estáticos
express.static.mime.define({'text/css': ['css']});
express.static.mime.define({'application/javascript': ['js']});

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

// Rotas da API
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/quiz/respostas', [
    body('respostas').isArray(),
    body('respostas.*.pergunta').notEmpty(),
    body('respostas.*.resposta').notEmpty()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const respostas = req.body;
    console.log('Respostas recebidas:', respostas);
    res.json({ 
        success: true, 
        message: 'Respostas salvas com sucesso!',
        timestamp: new Date().toISOString()
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
        return res.json({ 
            checkoutUrl: 'https://go.perfectpay.com.br/PPU38CPIB8O'
        });
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

// Middleware de erro global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
    });
});

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} em ${process.env.NODE_ENV || 'development'}`);
}); 