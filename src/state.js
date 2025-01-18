const fs = require('fs');
const { customButtons } = require('./actuator');
const configSaveFilePath = './src/config.json';
const windows = require('./ui/windows.js');

const defaultConfig = {
    windowTitle: 'test.txt - Notepad',
    startDelayM: 0,
    endDelayM: 0,
    volumeThreshold: 0.4,
    reelInMode: 'interact', // interact | randomClicks
    randomClicksWindowSettings: { posX: 0, posY: 0, width: 250, height: 50, stepX: 30, stepY: 30, entropy: 10},
    runInBackground: true,
    customButtons: [{"label":"Dejunk","active":false,"button":"alt+5","intervalS":5,"delayMs":0,"inFishCast":true,"runAtStart":false},{"label":"Open Clams","active":false,"button":"alt+6","intervalS":3600,"delayMs":11000,"inFishCast":true,"runAtStart":false},{"label":"Bufffood","active":false,"button":"alt+7","intervalS":3600,"delayMs":11000,"inFishCast":false,"runAtStart":false},{"label":"Button 4","active":false,"button":"alt+8","intervalS":0,"delayMs":0,"inFishCast":false,"runAtStart":false},{"label":"Button 5","active":false,"button":"alt+9","intervalS":0,"delayMs":0,"inFishCast":false,"runAtStart":false},{"label":"Button 6","active":false,"button":"alt+0","intervalS":0,"delayMs":0,"inFishCast":false,"runAtStart":false}],
    fishButton: '7',
    interactButton: '+',
    randomActions: {
        mouseMoveClick: true,
        wait: true
    }
};
const defaultSession = {
    running: false,
    startedAt: 0,
    round: 1,
    customButtonTimers: [0,0,0,0,0,0],
    logs: [],
    reelInFails: 0
};

exports.config;
exports.session;

exports.initConfig = async () => {
    exports.config = JSON.parse(JSON.stringify(defaultConfig));

    if (fs.existsSync(configSaveFilePath)) {
        const data = fs.readFileSync(configSaveFilePath, 'utf8');
        jsonData = JSON.parse(data);
        for (const key in jsonData)
            if (key in exports.config)
                exports.config[key] = jsonData[key];
    }
};

exports.initSession = async () => {
    exports.session = JSON.parse(JSON.stringify(defaultSession));
};

exports.updateConfig = async (field, value) => {
    console.log('updateConfig',field,value);
    exports.config[field] = value;
    if (!(await checkState())) return;
        
    await saveConfig();

    if (field == 'reelInMode')
        await windows.toggleClickWindow();

    if (field == 'randomClicksWindowSettings' && exports.config.reelInMode=='randomClicks') {
        await windows.toggleClickWindow();
        await windows.clickWindow.setSize(value.width,value.height);
        await windows.clickWindow.setPosition(value.posX,value.posY);
    }
};

exports.updateSession = async (field, value) => {
    console.log('updateSession',field,value);

    if (field == 'running' && value == true) {
        await exports.addUiLog('warning' ,'Bot starting...');
        if (!(await checkState())) return;

        await exports.initSession();
        exports.session.startedAt = Date.now();
        for (let i=0; i < exports.config.customButtons.length; i++)
            if (!exports.config.customButtons[i].runAtStart)
                exports.session.customButtonTimers[i] = Date.now();
    }
    if (field == 'running' && value == false) {
        await exports.addUiLog('warning' ,'Bot stopping...');
    }

    exports.session[field] = value;
};

exports.popUiLogs = async () => {
    logs = [];
    for (const log of exports.session.logs)
        logs.push(exports.session.logs.shift());
    
    return logs;
};

exports.addUiLog = async (level, message) => {
    exports.session.logs.push({addDate: Date.now(), level: level, message: message})
};

const saveConfig = async () => {
    fs.writeFileSync(configSaveFilePath, JSON.stringify(exports.config), {} )
};

const checkState = async () => {
    let error = null;

    if (typeof exports.config.windowTitle != 'string' || exports.config.windowTitle.trim() == '')
        error = 'Field windowTitle needs to be a string and not empty.';

    if (typeof exports.config.startDelayM != 'number' || isNaN(exports.config.startDelayM))
        error = 'Field startDelayM needs to be a number.';

    if (typeof exports.config.endDelayM != 'number' || isNaN(exports.config.endDelayM))
        error = 'Field endDelayM needs to be a number (0 means no end).';

    if (typeof exports.config.volumeThreshold != 'number' || isNaN(exports.config.volumeThreshold))
        error = 'Field volumeThreshold needs to be a number.';

    if (typeof exports.config.reelInMode != 'string' || (exports.config.reelInMode != 'interact' && exports.config.reelInMode != 'randomClicks'))
        error = 'Field reelInMode needs to be "interact" or "randomClicks".';

    if (typeof exports.config.runInBackground != 'boolean')
        error = 'Field runInBackground needs to be true or false.';

    if (typeof exports.config.fishButton != 'string' || exports.config.windowTitle.trim() == '')
        error = 'Field fishButton needs to be a string and not empty.';
    
    if (typeof exports.config.interactButton != 'string' || exports.config.windowTitle.trim() == '')
        error = 'Field interactButton needs to be a string and not empty.';

    // TODO Check customButtons
    for (let i = 0; i < exports.config.customButtons.length; i++) {
        const customButton = exports.config.customButtons[i];
        if (typeof customButton.label != 'string')
            error = 'Custom Button #' + (i+1) + ' field label needs to be a string.';
        if (typeof customButton.button != 'string')
            error = 'Custom Button #' + (i+1) + ' field button needs to be a string.';
        if (typeof customButton.intervalS != 'number' || isNaN(exports.config.volumeThreshold))
            error = 'Custom Button #' + (i+1) + ' field interval needs to be a number.';
        if (typeof customButton.delayMs != 'number' || isNaN(exports.config.volumeThreshold))
            error = 'Custom Button #' + (i+1) + ' field delay needs to be a number.';
    }

    // TODO Check randomClicksWindowSettings
    if (typeof exports.config.randomClicksWindowSettings.posX != 'number' || isNaN(exports.config.randomClicksWindowSettings.posX))
        error = 'RandomClicks window settings field posX needs to be a number.';
    if (typeof exports.config.randomClicksWindowSettings.posY != 'number' || isNaN(exports.config.randomClicksWindowSettings.posY))
        error = 'RandomClicks window settings field posY needs to be a number.';
    if (typeof exports.config.randomClicksWindowSettings.width != 'number' || isNaN(exports.config.randomClicksWindowSettings.width))
        error = 'RandomClicks window settings field width needs to be a number.';
    if (typeof exports.config.randomClicksWindowSettings.height != 'number' || isNaN(exports.config.randomClicksWindowSettings.height))
        error = 'RandomClicks window settings field height needs to be a number.';
    if (typeof exports.config.randomClicksWindowSettings.stepX != 'number' || isNaN(exports.config.randomClicksWindowSettings.stepX))
        error = 'RandomClicks window settings field stepX needs to be a number.';
    if (typeof exports.config.randomClicksWindowSettings.stepY != 'number' || isNaN(exports.config.randomClicksWindowSettings.stepY))
        error = 'RandomClicks window settings field stepY needs to be a number.';
    if (typeof exports.config.randomClicksWindowSettings.entropy != 'number' || isNaN(exports.config.randomClicksWindowSettings.entropy))
        error = 'RandomClicks window settings field entropy needs to be a number.';


    // TODO Check randomActions
    if (typeof exports.config.randomActions.mouseMoveClick != 'boolean')
        error = 'RandomActions field mouseMoveClick needs to be true or false.';
    if (typeof exports.config.randomActions.wait != 'boolean')
        error = 'RandomActions field wait needs to be true or false.';

    if (error) {
        await exports.addUiLog('danger','Config problem: ' + error);
        if (exports.session.running == true) await exports.updateSession('running', false);
        return false;
    }

    return true;
};