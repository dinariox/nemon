const { ipcRenderer } = require('electron');

const updateScreenEl = document.getElementById('update-screen');
const updateMessageEl = document.getElementById('update-message');

ipcRenderer.on('update_available', () => {
	ipcRenderer.removeAllListeners('update_available');
	updateMessageEl.innerHTML = 'Update found. Downloading...';
	updateScreenEl.classList.add('show');
});

ipcRenderer.on('update_downloaded', () => {
	ipcRenderer.removeAllListeners('update_available');
	updateMessageEl.innerHTML = 'Update downloaded. Application will restart now...';
});
