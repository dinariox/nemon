const { ipcRenderer } = require('electron');
const ping = require('ping');

const DEFAULT_HOST = '8.8.8.8';
// const DEFAULT_HOST = 'eu-central367.discord.gg';
const DEFAULT_PING_AVG = 5;
let pingResults = [];

const pingInterval = setInterval(async () => {
	const res = await ping.promise.probe(DEFAULT_HOST);
	if (!res.alive) return;
	if (isNaN(res.time)) return;
	pingResults.push(res.time);
	if (pingResults.length > DEFAULT_PING_AVG) {
		pingResults.shift();
	}
	const avg = Math.round(pingResults.reduce((a, b) => a + b) / pingResults.length);
	document.getElementById('ping-display').innerHTML = avg;
}, 1000);

document.getElementById('ping-to').innerHTML = DEFAULT_HOST;

document.getElementById('close-btn').addEventListener('click', () => {
	ipcRenderer.send('close-app');
});
