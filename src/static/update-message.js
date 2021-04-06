const updateScreenEl = document.getElementById('update-screen');
const updateMessageEl = document.getElementById('update-message');

ipcRenderer.on('update_available', () => {
	ipcRenderer.removeAllListeners('update_available');
	updateMessageEl.innerHTML = 'Update found. Downloading...';
	updateScreenEl.classList.remove('hidden');
});

ipcRenderer.on('update_downloaded', () => {
	ipcRenderer.removeAllListeners('update_available');
	updateMessageEl.innerHTML = 'Update downloaded. Application will restart now...';
});

ipcRenderer.on('update_not_available', () => {
	console.log('no update available');
});

ipcRenderer.on('update_progress', (progress) => {
	updateMessageEl.innerHTML = `Update found. Downloading...<br/>${progress.percent}% - ${progress.transferred / 1024}/${progress.total / 1024}KB @ ${progress.bytesPerSecond / 1024}KB/s`;
});
