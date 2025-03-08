const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function optimizeImages(directory) {
    try {
        const files = await fs.readdir(directory);
        
        for (const file of files) {
            const filePath = path.join(directory, file);
            const stat = await fs.stat(filePath);
            
            if (stat.isDirectory()) {
                await optimizeImages(filePath);
                continue;
            }
            
            if (!['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file).toLowerCase())) {
                continue;
            }
            
            const optimizedPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
            
            await sharp(filePath)
                .webp({ quality: 80 })
                .toFile(optimizedPath);
            
            console.log(`Otimizado: ${file} -> ${path.basename(optimizedPath)}`);
        }
    } catch (error) {
        console.error('Erro ao otimizar imagens:', error);
    }
}

// Otimiza imagens na pasta assets
optimizeImages(path.join(__dirname, '../assets')); 