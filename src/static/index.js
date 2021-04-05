// IMPORTS
const { ipcRenderer } = require('electron');
const ping = require('ping');
const Store = require('electron-store');
const config = new Store();

// GLOBAL VARS
const DEFAULT_HOST = config.get('hosts')[config.get('displayedHosts')[0]];
// const DEFAULT_HOST = 'eu-central367.discord.gg';
const DEFAULT_PING_AVG = config.get('pingAvg');
let pingResults = [];

// HTML ELEMENTS
const closeBtnEl = document.getElementById('close-btn');
const settingsBtnEl = document.getElementById('settings-btn');
const backBtnEl = document.getElementById('back-btn');
const pingDisplayEl = document.getElementById('ping-display');
const pingToEl = document.getElementById('ping-to');
const settingsScreenEl = document.getElementById('settings-screen');
const cbAlwaysOnTopEl = document.getElementById('cb-alwaysOnTop');
const cbLaunchOnStartupEl = document.getElementById('cb-launchOnStartup');

const pingInterval = setInterval(async () => {
	const res = await ping.promise.probe(DEFAULT_HOST);
	if (!res.alive) return;
	if (isNaN(res.time)) return;
	pingResults.push(res.time);
	if (pingResults.length > DEFAULT_PING_AVG) {
		pingResults.shift(); // remove first element of array
	}
	const avg = Math.round(pingResults.reduce((a, b) => a + b) / pingResults.length);
	pingDisplayEl.innerHTML = avg;
}, 1000);

pingToEl.innerHTML = DEFAULT_HOST;

closeBtnEl.addEventListener('click', () => {
	ipcRenderer.send('close-app');
});

settingsBtnEl.addEventListener('click', () => {
	settingsScreenEl.classList.add('show');
	settingsBtnEl.classList.remove('show');
	backBtnEl.classList.add('show');
});

backBtnEl.addEventListener('click', () => {
	settingsScreenEl.classList.remove('show');
	settingsBtnEl.classList.add('show');
	backBtnEl.classList.remove('show');
});

cbAlwaysOnTopEl.checked = config.get('alwaysOnTop');
cbLaunchOnStartupEl.checked = config.get('launchOnStartup');

cbAlwaysOnTopEl.addEventListener('change', (e) => {
	config.set('alwaysOnTop', e.target.checked);
	ipcRenderer.send('change-alwaysOnTop', e.target.checked);
});
cbLaunchOnStartupEl.addEventListener('change', (e) => {
	config.set('launchOnStartup', e.target.checked);
	ipcRenderer.send('change-launchOnStartup', e.target.checked);
});

async function wait(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function showSettingsButton() {
	await wait(4000);
	settingsBtnEl.classList.add('show');
}

showSettingsButton();
