const { app, BrowserWindow, ipcMain, dialog, Tray, nativeImage, Menu, shell } = require("electron");
const path = require("path");
const Store = require("electron-store");
const isDev = require("electron-is-dev");
const AutoLaunch = require("easy-auto-launch");
const { autoUpdater } = require("electron-updater");
const windowStateKeeper = require("electron-window-state");
const { spawn } = require("child_process");
const commandExistsSync = require("command-exists").sync;

const configSchema = require("./config-schema.json");
let config; // config is stored in %appdata%\Nemon\config.json
try {
    config = new Store({ schema: configSchema, clearInvalidConfig: true });
} catch (err) {
    dialog.showErrorBox(
        "Error",
        "Config file could not be loaded, it may be invalid. Try deleting the config.json file in the installation directory (%appdata%\\Nemon)."
    );
    return app.exit(0);
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
    // eslint-disable-line global-require
    app.quit();
}

let mainWindow;
let tray;

const createWindow = () => {
    const mainWindowState = windowStateKeeper({ defaultWidth: 400, defaultHeight: 200 });

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: mainWindowState.width,
        height: mainWindowState.height,
        x: mainWindowState.x,
        y: mainWindowState.y,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        fullscreenable: false,
        maximizable: false,
        resizable: false,
        alwaysOnTop: config.get("alwaysOnTop"),
        icon: path.join(__dirname, "icons/win/Nemon.ico"),
        skipTaskbar: config.get("hideInTaskbar"),
    });

    mainWindowState.manage(mainWindow);

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, "static/index.html"));

    mainWindow.setAlwaysOnTop(config.get("alwaysOnTop"), "screen-saver");

    ipcMain.on("change-alwaysOnTop", (e, onoff) => {
        mainWindow.setAlwaysOnTop(onoff, "screen-saver");
    });

    ipcMain.on("change-hideInTaskbar", (e, onoff) => {
        mainWindow.setSkipTaskbar(onoff);
    });

    mainWindow.once("ready-to-show", () => {
        autoUpdater.checkForUpdates();
    });

    // Tray
    const icon = nativeImage.createFromPath(path.join(__dirname, "icons/win/Nemon.ico"));
    tray = new Tray(icon);
    tray.setToolTip("Nemon");
    tray.setTitle("Nemon");
    tray.setContextMenu(
        Menu.buildFromTemplate([
            {
                label: "Show",
                click: () => {
                    mainWindow.restore();
                },
            },
            {
                label: "Quit",
                click: () => {
                    app.quit();
                },
            },
        ])
    );
    tray.addListener("double-click", () => {
        mainWindow.restore();
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on("close-app", () => {
    app.quit();
});

ipcMain.on("minimize-app", () => {
    mainWindow.minimize();
});

if (!isDev) {
    const autoLauncher = new AutoLaunch({
        name: "Nemon",
    });

    if (config.get("launchOnStartup")) {
        autoLauncher.enable();
    } else {
        autoLauncher.disable();
    }

    ipcMain.on("change-launchOnStartup", (e, onoff) => {
        if (onoff) {
            autoLauncher.enable();
        } else {
            autoLauncher.disable();
        }
    });
}

ipcMain.on("app-version", (event) => {
    event.sender.send("app-version", app.getVersion());
});

ipcMain.on("open-changelog", () => {
    shell.openExternal("https://github.com/dinariox/nemon/releases/tag/v" + app.getVersion());
});

ipcMain.on("start-speedtest", async (event) => {
    console.log("Starting speedtest...");
    try {
        if (!commandExistsSync("speedtest")) {
            dialog.showErrorBox("Error", "Speedtest CLI is not installed. Please install it from https://www.speedtest.net/apps/cli");
            return;
        }

        const speedtest = spawn("speedtest", ["--accept-license", "--accept-gdpr", "-f", "jsonl"]);
        speedtest.stdout.on("data", (data) => {
            const json = JSON.parse(data);
            if ("type" in json && json.type === "download") {
                console.log("Download speed: " + json.download.bandwidth / 1000000 + " MB/s");
                event.sender.send("speedtest-data-download", json.download.bandwidth);
            } else if ("type" in json && json.type === "upload") {
                console.log("Upload speed: " + json.upload.bandwidth / 1000000 + " MB/s");
                event.sender.send("speedtest-data-upload", json.upload.bandwidth);
            } else if ("type" in json && json.type === "result") {
                console.log(
                    "[Result] Download speed: " + json.download.bandwidth / 1000000 + " MB/s | Upload speed: " + json.upload.bandwidth / 1000000 + " MB/s"
                );
                event.sender.send("speedtest-data-result", json.download.bandwidth, json.upload.bandwidth);
            }
        });

        speedtest.stderr.on("data", (data) => {
            console.error(`stderr: ${data}`);
        });
    } catch (e) {
        console.error(e);
        return;
    }
});

autoUpdater.on("update-available", () => {
    mainWindow.webContents.send("update_available");
});

autoUpdater.on("update-not-available", () => {
    mainWindow.webContents.send("update_not_available");
});

autoUpdater.on("download-progress", (progress) => {
    mainWindow.webContents.send("update_progress", progress);
});

autoUpdater.on("update-downloaded", () => {
    mainWindow.webContents.send("update_downloaded");
    setTimeout(() => {
        autoUpdater.quitAndInstall();
    }, 2500);
});
