// Configurações globais
window.FB_PIXEL_ID = '622557317228832';

// Outras configurações do ambiente
window.API_URL = 'https://queimadefinitiva.shop';
window.ENVIRONMENT = 'production';

// Configurações do ambiente
const env = {
    FACEBOOK_PIXEL_ID: '622557317228832', // Seu ID real do Facebook Pixel
    API_URL: 'http://localhost:3000' // URL do servidor local
};

// Define globalmente
window.env = env;

// Suporte a módulos ES6
if (typeof exports !== 'undefined') {
    exports.default = env;
} 