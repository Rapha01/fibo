const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const util = require('../util/util.js');
const rendererEvents = require('./rendererEvents.js');
const state = require('../state.js');

let electronAppReady = false;
exports.menuWindow = null;
exports.clickWindow = null;

const createMenuWindow = async (settings) => {
  while(!electronAppReady) 
    await util.sleep(200);

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    //alwaysOnTop: true,
    x: 0,
    y: 0,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
  });

  await win.setContentProtection(true);
  await win.loadFile('./src/ui/index.html', { query: JSON.stringify(settings) });

  if (!(process.env.NODE_ENV == 'prod'))
    await win.webContents.openDevTools();
  
  win.on('closed', () => {
    app.quit();
  });

  return win;
}

const createClickWindow = async () => {
  while(!electronAppReady)
    await util.sleep(200);

  const win = new BrowserWindow({
    width: state.config.randomClicksWindowSettings.width,
    height: state.config.randomClicksWindowSettings.height,
    alwaysOnTop: true,
    frame: false,
    x: state.config.randomClicksWindowSettings.posX,
    y: state.config.randomClicksWindowSettings.posY,
    opacity: 0.3,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  await win.setContentProtection(true);
  await win.setIgnoreMouseEvents(true);
  //win.loadFile('index.html');
  
  win.on('closed', () => {
    clickWindow = null;
  });

  return win;
}

app.whenReady().then(() => {
  ipcMain.handle('typeMessage', rendererEvents.handleTypeMessage);

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  electronAppReady = true;
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

exports.initMenuWindow = async () => {
  if (exports.menuWindow && !exports.menuWindow.isDestroyed())
    exports.menuWindow.close();

  exports.menuWindow = await createMenuWindow();
  return exports.menuWindow;
}

exports.toggleClickWindow = async () => {
  if (state.config.reelInMode == 'interact' && exports.clickWindow && !exports.clickWindow.isDestroyed())
    exports.clickWindow.close();

  if (state.config.reelInMode == 'randomClicks' && (!exports.clickWindow || exports.clickWindow.isDestroyed()))
    exports.clickWindow = await createClickWindow();

  return exports.clickWindow;
}