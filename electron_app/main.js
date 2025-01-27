const { app, BrowserWindow, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;
let isQuitting = false; // Define the isQuitting variable
let downloadInProgress = false; // Track if a download is in progress

// Function to create the main window
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        }
    });

    mainWindow.loadURL('https://imhotepf.pythonanywhere.com/');

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (!isInternalURL(url)) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (!isInternalURL(url)) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });

    mainWindow.on('close', (e) => {
        if (!isQuitting) {
            e.preventDefault();
            mainWindow.hide();
        }
    });
}

// Check if the URL is internal
function isInternalURL(url) {
    const appDomain = 'https://imhotepf.pythonanywhere.com';
    return url.startsWith(appDomain);
}

// Show download progress and allow user to cancel the download
function showUpdateAlert() {
    downloadInProgress = true;
    autoUpdater.downloadUpdate();

    // Show initial update dialog with a "Cancel" button
    const downloadDialog = dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: 'A new version is available. Downloading now...',
        buttons: ['Cancel'],
        defaultId: 0,
        cancelId: 0,
    }).then((result) => {
        if (result.response === 0 && downloadInProgress) {  // "Cancel" button clicked
            console.log('User canceled the download.');
            autoUpdater.autoDownload = false;
            downloadInProgress = false;
            dialog.showMessageBox({
                type: 'info',
                title: 'Download Canceled',
                message: 'The update download has been canceled.',
            });
        }
    });

    // Track download progress in console
    autoUpdater.on('download-progress', (progressObj) => {
        const percentage = Math.round(progressObj.percent);
        console.log(`Downloading: ${percentage}%`);
    });

    // Automatically install the update upon download completion
    autoUpdater.on('update-downloaded', () => {
        console.log('Update downloaded. Automatically restarting to install.');
        downloadInProgress = false;

        // Immediately apply the update and restart the application
        autoUpdater.quitAndInstall();
    });
}

// Check for application updates
function checkForUpdates() {
    console.log('Checking for updates...');
    autoUpdater.autoDownload = false; // Manually download upon user confirmation
    autoUpdater.checkForUpdates();

    autoUpdater.on('update-available', () => {
        console.log('Update available. Displaying update alert.');
        showUpdateAlert();
    });

    autoUpdater.on('error', (error) => {
        console.error('Update error:', error);
        dialog.showErrorBox('Update Error', error ? error.stack : 'Unknown error');
    });
}

// Ensure only a single instance of the application is running
if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
        }
    });

    app.on('ready', () => {
        createWindow();
        checkForUpdates();
    });

    app.on('before-quit', () => {
        isQuitting = true; // Set isQuitting to true before quitting
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else {
            mainWindow.show();
        }
    });
}