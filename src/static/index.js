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
let DEFAULT_HOST = config.get('host') || '1.1.1.1';
// const DEFAULT_HOST = '8.8.8.8';
// const DEFAULT_HOST = 'eu-central367.discord.gg';
let DEFAULT_PING_AVG = config.get('pingAvg') || 5;
// const DEFAULT_PING_AVG = 5;
let PING_INTERVAL = config.get('pingInterval') || 1000;
const PING_INTERVAL_MIN = 500,
	PING_INTERVAL_MAX = 10000,
	PING_AVG_MIN = 1,
	PING_AVG_MAX = 10,
	CONNECTION_LOST_THRESHOLD_MIN = 1,
	CONNECTION_LOST_THRESHOLD_MAX = 50;
// const PING_INTERVAL = 1000;
let NOT_ALIVE_CONNECTION_LOST_THRESHOLD = config.get('notAliveConnectionLostThreshold') || 3;
// const NOT_ALIVE_CONNECTION_LOST_THRESHOLD = 3;
let pingResults = [];
let notAliveCnt = 0;

// HTML ELEMENTS
const closeBtnEl = document.getElementById('close-btn');
const minimizeBtnEl = document.getElementById('minimize-btn');
const settingsBtnEl = document.getElementById('settings-btn');
const backBtnEl = document.getElementById('back-btn');
const pingDisplayEl = document.getElementById('ping-display');
const pingToEl = document.getElementById('ping-to');
const settingsScreenEl = document.getElementById('settings-screen');
const versionEl = document.getElementById('version');
const connectionLostEl = document.getElementById('connection-lost');
const cbAlwaysOnTopEl = document.getElementById('cb-alwaysOnTop');
const cbLaunchOnStartupEl = document.getElementById('cb-launchOnStartup');
const cbHideInTaskbarEl = document.getElementById('cb-hideInTaskbar');
const cbShowPingChartEl = document.getElementById('cb-showPingChart');
const tbPingToEl = document.getElementById('tb-pingTo');
const tbPingIntervalEl = document.getElementById('tb-pingInterval');
const tbPingAvgEl = document.getElementById('tb-pingAvg');
const tbNotAliveConnectionLostThresholdEl = document.getElementById('tb-notAliveConnectionLostThreshold');

// = = = = = = = = = = = = = = =
// = PING FUNCTIONS  = = = = = =
// = = = = = = = = = = = = = = =
async function pingIntervalFunc() {
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
}

const pingInterval = setInterval(pingIntervalFunc, PING_INTERVAL);

// = = = = = = = = = = = = = = =
// = DOM SETUP = = = = = = = = =
// = = = = = = = = = = = = = = =
pingToEl.innerHTML = DEFAULT_HOST;
cbAlwaysOnTopEl.checked = config.get('alwaysOnTop');
cbLaunchOnStartupEl.checked = config.get('launchOnStartup');
cbShowPingChartEl.checked = config.get('showPingChart');
tbPingToEl.value = DEFAULT_HOST;
tbPingIntervalEl.value = PING_INTERVAL;
tbPingAvgEl.value = DEFAULT_PING_AVG;
tbNotAliveConnectionLostThresholdEl.value = NOT_ALIVE_CONNECTION_LOST_THRESHOLD;

// = = = = = = = = = = = = = = =
// = Event Listeners = = = = = =
// = = = = = = = = = = = = = = =
ipcRenderer.send('app_version');
ipcRenderer.on('app_version', (e, ver) => {
	ipcRenderer.removeAllListeners('app_version');
	versionEl.innerHTML = 'v' + ver;
});

closeBtnEl.addEventListener('click', () => {
	ipcRenderer.send('close-app');
});

minimizeBtnEl.addEventListener('click', () => {
	ipcRenderer.send('minimize-app');
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

cbAlwaysOnTopEl.addEventListener('change', (e) => {
	config.set('alwaysOnTop', e.target.checked);
	ipcRenderer.send('change-alwaysOnTop', e.target.checked);
});

cbLaunchOnStartupEl.addEventListener('change', (e) => {
	config.set('launchOnStartup', e.target.checked);
	ipcRenderer.send('change-launchOnStartup', e.target.checked);
});

cbHideInTaskbarEl.addEventListener('change', (e) => {
	config.set('hideInTaskbar', e.target.checked);
	ipcRenderer.send('change-hideInTaskbar', e.target.checked);
});

cbShowPingChartEl.addEventListener('change', (e) => {
	config.set('showPingChart', e.target.checked);
});

tbPingToEl.addEventListener('change', (e) => {
	DEFAULT_HOST = e.target.value;
	config.set('host', DEFAULT_HOST);
	pingToEl.innerHTML = DEFAULT_HOST;
});

tbPingIntervalEl.addEventListener('change', (e) => {
	let val = parseInt(e.target.value);
	// clamp value between min and max
	if (val < PING_INTERVAL_MIN) val = PING_INTERVAL_MIN;
	if (val > PING_INTERVAL_MAX) val = PING_INTERVAL_MAX;
	PING_INTERVAL = val;
	e.target.value = val.toString();
	config.set('pingInterval', PING_INTERVAL);
});

tbPingAvgEl.addEventListener('change', (e) => {
	let val = parseInt(e.target.value);
	// clamp value between min and max
	if (val < PING_AVG_MIN) val = PING_AVG_MIN;
	if (val > PING_AVG_MAX) val = PING_AVG_MAX;
	DEFAULT_PING_AVG = val;
	e.target.value = val.toString();
	config.set('pingAvg', DEFAULT_PING_AVG);
	pingResults = [];
});

tbNotAliveConnectionLostThresholdEl.addEventListener('change', (e) => {
	let val = parseInt(e.target.value);
	// clamp value between min and max
	if (val < CONNECTION_LOST_THRESHOLD_MIN) val = CONNECTION_LOST_THRESHOLD_MIN;
	if (val > CONNECTION_LOST_THRESHOLD_MAX) val = CONNECTION_LOST_THRESHOLD_MAX;
	NOT_ALIVE_CONNECTION_LOST_THRESHOLD = val;
	e.target.value = val.toString();
	config.set('notAliveConnectionLostThreshold', NOT_ALIVE_CONNECTION_LOST_THRESHOLD);
});

// = = = = = = = = = = = = = = =
// = UTILITY FUNCTIONS = = = = =
// = = = = = = = = = = = = = = =
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
