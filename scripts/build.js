const fs = require('fs').promises;
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');
const sharp = require('sharp');

// Função para criar diretório se não existir
async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
    }
}

// Função para copiar arquivo
async function copyFile(src, dest) {
    await fs.copyFile(src, dest);
    console.log(`Copiado: ${path.basename(src)} -> ${path.basename(dest)}`);
}

// Função para limpar diretório dist
async function cleanDist() {
    try {
        await fs.rm(path.join(__dirname, '../dist'), { recursive: true, force: true });
        console.log('Pasta dist limpa');
    } catch (error) {
        console.error('Erro ao limpar pasta dist:', error);
    }
}

// Função para minificar JS
async function minifyJS(file, destDir) {
    try {
        const code = await fs.readFile(file, 'utf8');
        const minified = await minify(code, {
            compress: {
                dead_code: true,
                drop_console: true,
                drop_debugger: true,
                keep_fnames: false,
                keep_infinity: true,
                passes: 2
            },
            mangle: {
                toplevel: true,
                keep_fnames: false
            },
            format: {
                comments: false
            }
        });
        
        const fileName = path.basename(file);
        const minifiedPath = path.join(destDir, fileName.replace('.js', '.min.js'));
        await fs.writeFile(minifiedPath, minified.code);
        console.log(`Minificado: ${fileName}`);
    } catch (error) {
        console.error(`Erro ao minificar ${file}:`, error);
    }
}

// Função para minificar CSS
async function minifyCSS(file, destDir) {
    try {
        const css = await fs.readFile(file, 'utf8');
        const minified = new CleanCSS({
            level: 2,
            format: 'keep-breaks'
        }).minify(css);
        
        const fileName = path.basename(file);
        const minifiedPath = path.join(destDir, fileName.replace('.css', '.min.css'));
        await fs.writeFile(minifiedPath, minified.styles);
        console.log(`Minificado: ${fileName}`);
    } catch (error) {
        console.error(`Erro ao minificar ${file}:`, error);
    }
}

// Função para otimizar imagens
async function optimizeImage(file, destDir) {
    try {
        const fileName = path.basename(file);
        const optimizedPath = path.join(destDir, fileName.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
        
        await sharp(file)
            .webp({ quality: 80 })
            .toFile(optimizedPath);
        
        console.log(`Otimizado: ${fileName}`);
    } catch (error) {
        console.error(`Erro ao otimizar ${file}:`, error);
    }
}

// Função principal de build
async function build() {
    try {
        // Limpa a pasta dist
        await cleanDist();
        
        // Cria estrutura de diretórios
        const distDir = path.join(__dirname, '../dist');
        const assetsDir = path.join(distDir, 'assets');
        const quizDir = path.join(distDir, 'quiz');
        
        await ensureDir(distDir);
        await ensureDir(assetsDir);
        await ensureDir(quizDir);
        
        // Copia e processa arquivos HTML
        await copyFile(
            path.join(__dirname, '../index.html'),
            path.join(distDir, 'index.html')
        );
        await copyFile(
            path.join(__dirname, '../quiz/index.html'),
            path.join(quizDir, 'index.html')
        );
        await copyFile(
            path.join(__dirname, '../quiz/play.html'),
            path.join(quizDir, 'play.html')
        );
        await copyFile(
            path.join(__dirname, '../quiz/Checkout.html'),
            path.join(quizDir, 'Checkout.html')
        );
        
        // Processa arquivos JS
        const jsFiles = [
            path.join(__dirname, '../pixel-loader.js'),
            path.join(__dirname, '../quiz/config.js'),
            path.join(__dirname, '../quiz/script.js')
        ];
        
        for (const file of jsFiles) {
            await minifyJS(file, file.includes('quiz') ? quizDir : distDir);
        }
        
        // Processa arquivos CSS
        const cssFiles = [
            path.join(__dirname, '../style.css'),
            path.join(__dirname, '../quiz/style.css'),
            path.join(__dirname, '../quiz/checkout-style.css')
        ];
        
        for (const file of cssFiles) {
            await minifyCSS(file, file.includes('quiz') ? quizDir : distDir);
        }
        
        // Processa imagens
        const assetsPath = path.join(__dirname, '../assets');
        const files = await fs.readdir(assetsPath);
        
        for (const file of files) {
            const filePath = path.join(assetsPath, file);
            const stat = await fs.stat(filePath);
            
            if (!stat.isDirectory() && /\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
                if (file.endsWith('.webp')) {
                    // Se já for WebP, apenas copia
                    await copyFile(filePath, path.join(assetsDir, file));
                } else {
                    // Se não for WebP, converte
                    await optimizeImage(filePath, assetsDir);
                }
            }
        }
        
        console.log('Build concluído com sucesso!');
        
    } catch (error) {
        console.error('Erro durante o build:', error);
        process.exit(1);
    }
}

// Executa o build
build(); 