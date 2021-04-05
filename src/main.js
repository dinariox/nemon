const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const isDev = require('electron-is-dev');
const AutoLaunch = require('auto-launch');
const os = require('os');
const _ = require('lodash');

const configSchema = require('./config-schema.json');
let config;
try {
	config = new Store({ schema: configSchema, clearInvalidConfig: true });
} catch (err) {
	dialog.showErrorBox('Error', 'Config file could not be loaded, it may be invalid. Try deleting the config.json file in the installation directory.');
	return app.exit(0);
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
	// eslint-disable-line global-require
	app.quit();
}

const createWindow = () => {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 400,
		height: 200,
		frame: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		},
		fullscreenable: false,
		maximizable: false,
		resizable: false,
		alwaysOnTop: config.get('alwaysOnTop'),
		icon: __dirname + '/icons/win/Nemon.ico'
	});

	// and load the index.html of the app.
	mainWindow.loadFile(path.join(__dirname, 'static/index.html'));

	ipcMain.on('change-alwaysOnTop', (e, onoff) => {
		mainWindow.setAlwaysOnTop(onoff);
	});
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on('close-app', () => {
	app.quit();
});

if (!isDev) {
	const autoLauncher = new AutoLaunch({
		name: 'Nemon'
	});

	if (config.get('launchOnStartup')) {
		autoLauncher.enable();
	} else {
		autoLauncher.disable();
	}

	ipcMain.on('change-launchOnStartup', (e, onoff) => {
		if (onoff) {
			autoLauncher.enable();
		} else {
			autoLauncher.disable();
		}
	});
}
