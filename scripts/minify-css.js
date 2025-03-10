const CleanCSS = require('clean-css');
const fs = require('fs').promises;
const path = require('path');

async function minifyCSS(directory) {
    try {
        const files = await fs.readdir(directory);
        
        for (const file of files) {
            const filePath = path.join(directory, file);
            const stat = await fs.stat(filePath);
            
            if (stat.isDirectory()) {
                await minifyCSS(filePath);
                continue;
            }
            
            if (!file.endsWith('.css') || file.endsWith('.min.css')) {
                continue;
            }
            
            const css = await fs.readFile(filePath, 'utf8');
            const minified = new CleanCSS({
                level: 2,
                format: 'keep-breaks'
            }).minify(css);
            
            const minifiedPath = filePath.replace('.css', '.min.css');
            await fs.writeFile(minifiedPath, minified.styles);
            console.log(`Minificado: ${file} -> ${path.basename(minifiedPath)}`);
        }
    } catch (error) {
        console.error('Erro ao minificar CSS:', error);
    }
}

// Minifica arquivos CSS
minifyCSS(path.join(__dirname, '../')); 