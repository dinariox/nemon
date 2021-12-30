// IMPORTS
const { ipcRenderer } = require('electron');
const ping = require('ping');
const Store = require('electron-store');
const configSchema = require('../config-schema.json');
const config = new Store({ schema: configSchema });
const Chartist = require('chartist');
const pingChart = config.get('showPingChart')
	? new Chartist.Line(
			'.ct-chart',
			{
				labels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
				series: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
			},
			{
				width: '100%',
				height: '100%',
				showPoint: false,
				axisX: {
					showLabel: false,
					showGrid: false,
					offset: 0
				},
				axisY: {
					showLabel: false,
					showGrid: false,
					offset: 0
				},
				high: 300,
				low: 10,
				fullWidth: true,
				showArea: true,
				chartPadding: 0
			}
	  )
	: null;

// GLOBAL VARS
// const DEFAULT_HOST = config.get('hosts')[config.get('displayedHosts')[0]];
const DEFAULT_HOST = '8.8.8.8';
// const DEFAULT_HOST = 'eu-central367.discord.gg';
// const DEFAULT_PING_AVG = config.get('pingAvg');
const DEFAULT_PING_AVG = 5;
// const PING_INTERVAL = config.get('pingInterval');
const PING_INTERVAL = 1000;
// const NOT_ALIVE_CONNECTION_LOST_THRESHOLD = config.get('notAliveConnectionLostThreshold');
const NOT_ALIVE_CONNECTION_LOST_THRESHOLD = 3;
let pingResults = [];
let notAliveCnt = 0;

// HTML ELEMENTS
const closeBtnEl = document.getElementById('close-btn');
const settingsBtnEl = document.getElementById('settings-btn');
const backBtnEl = document.getElementById('back-btn');
const pingDisplayEl = document.getElementById('ping-display');
const pingToEl = document.getElementById('ping-to');
const settingsScreenEl = document.getElementById('settings-screen');
const cbAlwaysOnTopEl = document.getElementById('cb-alwaysOnTop');
const cbLaunchOnStartupEl = document.getElementById('cb-launchOnStartup');
const cbShowPingChartEl = document.getElementById('cb-showPingChart');
const versionEl = document.getElementById('version');
const connectionLostEl = document.getElementById('connection-lost');

const pingInterval = setInterval(async () => {
	const res = await ping.promise.probe(DEFAULT_HOST);
	if (!res.alive) {
		notAliveCnt++;
		if (notAliveCnt >= NOT_ALIVE_CONNECTION_LOST_THRESHOLD) {
			connectionLostEl.classList.remove('hidden');
		}
		return;
	}
	if (isNaN(res.time)) return;
	notAliveCnt = 0;
	connectionLostEl.classList.add('hidden');

	pingResults.push(res.time);
	if (pingResults.length > DEFAULT_PING_AVG) {
		pingResults.shift(); // remove first element of array
	}

	const avg = Math.round(pingResults.reduce((a, b) => a + b) / pingResults.length);
	pingDisplayEl.innerHTML = avg;

	if (pingChart) {
		let data = [...pingChart.data.series[0]];
		data.push(avg);
		data.shift();
		pingChart.update({ series: [data] });
	}
}, PING_INTERVAL);

pingToEl.innerHTML = DEFAULT_HOST;

ipcRenderer.send('app_version');
ipcRenderer.on('app_version', (e, ver) => {
	ipcRenderer.removeAllListeners('app_version');
	versionEl.innerHTML = 'v' + ver;
});

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
cbShowPingChartEl.checked = config.get('showPingChart');

cbAlwaysOnTopEl.addEventListener('change', (e) => {
	config.set('alwaysOnTop', e.target.checked);
	ipcRenderer.send('change-alwaysOnTop', e.target.checked);
});
cbLaunchOnStartupEl.addEventListener('change', (e) => {
	config.set('launchOnStartup', e.target.checked);
	ipcRenderer.send('change-launchOnStartup', e.target.checked);
});
cbShowPingChartEl.addEventListener('change', (e) => {
	config.set('showPingChart', e.target.checked);
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
