const { minify } = require('terser');
const fs = require('fs').promises;
const path = require('path');

async function minifyJS(directory) {
    try {
        const files = await fs.readdir(directory);
        
        for (const file of files) {
            const filePath = path.join(directory, file);
            const stat = await fs.stat(filePath);
            
            if (stat.isDirectory()) {
                await minifyJS(filePath);
                continue;
            }
            
            if (!file.endsWith('.js')) {
                continue;
            }
            
            const code = await fs.readFile(filePath, 'utf8');
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
            
            const minifiedPath = filePath.replace('.js', '.min.js');
            await fs.writeFile(minifiedPath, minified.code);
            console.log(`Minificado: ${file} -> ${path.basename(minifiedPath)}`);
        }
    } catch (error) {
        console.error('Erro ao minificar JS:', error);
    }
}

// Minifica arquivos JS
minifyJS(path.join(__dirname, '../')); 