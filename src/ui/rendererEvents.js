const state = require('../state.js');
const windows = require('./windows.js');
const util = require('../util/util.js');


const updateConfigState = async (data) => {
    //console.log('rendererEvent updateConfigState:',data.field,data.value);
    if (data.field == 'startDelayM' || data.field == 'endDelayM' || data.field == 'volumeThreshold' || data.field == 'globalCooldown')
        data.value = parseFloat(data.value);
    if (data.field == 'customButtons') {
      for (const customButton of data.value) {
        customButton.delayMs = parseFloat(customButton.delayMs);
        customButton.intervalS = parseFloat(customButton.intervalS);
      }
    }
    if (data.field == 'randomClicksWindowSettings') {
        for (key in data.value)
            data.value[key] = parseFloat(data.value[key]);
    }

    await state.updateConfig(data.field,data.value);
}

const updateSessionState = async (data) => {
    //console.log('rendererEvent updateSessionState:',data.field,data.value);
    await state.updateSession(data.field,data.value);
    return true;
}

const popUiLogs = async (data) => {
    return await state.popUiLogs();
}

const getSystemVolume = async (data) => {
    return await util.getSystemVolume();
}

const getState = async () => {
    return {config: state.config,session: state.session};
}

exports.handleTypeMessage = async (ipcEvent,data) => {
    if (!data.type)
        return false;
    else if (data.type == 'updateConfigState')
        return await updateConfigState(data);
    else if (data.type == 'updateSessionState')
        return await updateSessionState(data);
    else if (data.type == 'popUiLogs')
        return await popUiLogs(data);
    else if (data.type == 'getState')
        return await getState(data);
    else if (data.type == 'getSystemVolume')
        return await getSystemVolume(data);

    return false;
}