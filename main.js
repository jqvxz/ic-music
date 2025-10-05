const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const runtime = require('./runtime');
const dcPresence = require('./dc-presence');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 800,
        icon: path.join(__dirname, 'img', 'ic-icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            resizable: false,
            nodeIntegration: false
        },
        title: 'ic-music (beta)'
    });

    mainWindow.loadFile('index.html');
    mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
    // Ensure 'saves' directory exists
    const savesDir = path.join(__dirname, 'saves');
    if (!fs.existsSync(savesDir)) {
        console.log("'saves' directory missing, creating...");
        try {
            fs.mkdirSync(savesDir);
            console.log("'saves' directory created.");
        } catch (err) {
            console.error("Failed to create 'saves' directory:", err);
        }
    }

    // Ensure download.py exists
    const downloadPyPath = path.join(__dirname, 'download.py');
    if (!fs.existsSync(downloadPyPath)) {
        console.error("Critical: 'download.py' not found in the application root directory. Please add it.");
    }

    createWindow();

    ipcMain.handle('get-songs', async () => {
        return runtime.getSongs();
    });

    ipcMain.handle('delete-song', async (event, filename) => {
        try {
            const filePath = path.join(__dirname, 'saves', filename);
            await fs.promises.unlink(filePath);
            return true;
        } catch (err) {
            throw err;
        }
    });

    ipcMain.handle('download-song', async (event, searchTerm) => {
        return new Promise((resolve, reject) => {
            const command = `python download.py -s "${searchTerm}"`;
            console.log(`Executing: ${command}`);
            exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error: ${error.message}`);
                    reject(new Error(`Download failed: ${error.message}`));
                    return;
                }
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                }
                console.log(`stdout: ${stdout}`);
                const match = stdout.match(/__SUCCESS_FILENAME__(.*?)__/);
                if (match && match[1]) {
                    const filename = match[1].trim();
                    const baseName = path.parse(filename).name;
                    const coverPath = path.join(__dirname, 'saves', baseName + '.jpg');
                    const hasCover = fs.existsSync(coverPath);
                    const newSong = {
                        filename: filename,
                        coverAvailable: hasCover,
                        coverPath: hasCover ? coverPath : null
                    };
                    resolve(newSong);
                } else {
                    resolve(null);
                }
            });
        });
    });

    ipcMain.on('now-playing', (event, songTitle) => {
        dcPresence.setActivity(songTitle);
    });

    ipcMain.handle('open-saves-folder', async () => {
        await shell.openPath(savesDir);
        return true;
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
