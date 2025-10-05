const fs = require('fs');
const path = require('path');

const savesDir = path.join(__dirname, 'saves');

function getSongs() {
    const files = fs.readdirSync(savesDir);
    return files
        .filter((f) => f.endsWith('.mp3'))
        .map((file) => {
            const baseName = path.parse(file).name;
            const coverPath = path.join(savesDir, baseName + '.jpg');
            const hasCover = fs.existsSync(coverPath);
            return {
                filename: file,
                coverAvailable: hasCover,
                coverPath: hasCover ? coverPath : null
            };
        });
}

module.exports = { getSongs };
