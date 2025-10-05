const { app } = require('electron');
const { Client } = require('discord-rpc');

const CLIENT_ID = '1423629963185094686';
const rpc = new Client({ transport: 'ipc' });

let isReady = false;
let playStart = null;

rpc.on('ready', () => {
    isReady = true;
    console.log('Discord Rich Presence is ready');
    setActivity("Ic-music idle");
});

rpc.on('error', (error) => {
    console.error('Could not set Rich Presence:', error);
});

function setActivity(songTitle) {
    if (!isReady) return;
    if (songTitle && songTitle.trim() !== "") {
        playStart = new Date();
    } else {
        playStart = null;
    }
    rpc.setActivity({
        details: songTitle && songTitle.trim() !== "" ? `Playing: ${songTitle}` : "Windows music streamer",
        state: "Version 0.1.0 - development build",
        startTimestamp: playStart,
        largeImageKey: 'app_icon',
        largeImageText: 'ic-music',
        buttons: [
            { label: "Discord", url: "https://discord.gg/enf9WY5pPn/" },
            { label: "Source", url: "https://github.com/jqvxz/" },
        ]
    });
}

rpc.login({ clientId: CLIENT_ID }).catch(console.error);

app.on('before-quit', () => {
    rpc.destroy();
});

module.exports = { setActivity };
