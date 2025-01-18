const { Hardware, getAllWindows } = require('keysender');
const { sleep, randomSleep } = require('./util/util.js');
const util = require('./util/util.js');
const state = require('./state.js');

exports.getWindow = async (title) => {
    const windows = await getAllWindows();

    for (let win of windows) 
        if (win.title.toLowerCase() == title.toLowerCase() || win.title.toLowerCase() == '*' + title.toLowerCase()) {
            return new Hardware(win.handle);
        }

    throw new Error('Window not found');
};
  

exports.focusWindow = async (kswindow) => {
    if (!kswindow.workwindow.isOpen())
        throw new Error('Can\'t focus unopened window');

    if (!kswindow.workwindow.isForeground()) {
        kswindow.workwindow.setForeground();
        await sleep(2000);
    }
        
    return true;
};

exports.test = async (kswindow) => {
    await kswindow.keyboard.sendKey("a");
    await kswindow.keyboard.sendKey("a");
    await kswindow.keyboard.printText("hello");
        
    return true;
};

exports.castFishAndInFishCustomButtons = async (kswindow) => {
    await state.addUiLog('success' ,'Casting fishing rod.');
    await humanSendKey(kswindow,state.config.fishButton);
    const fishingStartDate = Date.now();
    await sleepGlobalCooldown();
    
    await exports.customButtons(kswindow, true);

    const timeElapsed = Date.now() - fishingStartDate;
    const waitTimeAfterCastingFish = 3000;
    const timeLeftToWait = waitTimeAfterCastingFish - timeElapsed;
    if (timeLeftToWait > 0)
        await sleep(timeLeftToWait)

    const timeElapsedS = (Date.now() - fishingStartDate) / 1000;
    return timeElapsedS;
}

exports.customButtons = async (kswindow,isFishing) => {
    // await state.addUiLog('success' ,'Using customButtons ' + (isFishing ? 'during' : 'after') + ' fishing.');

    for (let i=0; i < state.config.customButtons.length; i++) {
        if (!state.session.running) throw new Error('Bot stopped');

        const customButton = state.config.customButtons[i];
        
        if (!customButton.active) continue;
        if (!customButton.inFishCast && isFishing) continue;
        if (customButton.inFishCast && !isFishing) continue;

        const timeSinceLastUseS = (Date.now() - state.session.customButtonTimers[i]) / 1000;

        if (customButton.intervalS > timeSinceLastUseS) continue;

        state.session.customButtonTimers[i] = Date.now();
        await state.addUiLog('success' ,'Using customButton #' + (i+1) + ': ' + customButton.label);
        await humanSendKey(kswindow,customButton.button);

        await randomSleep(customButton.delayMs,customButton.delayMs*0,1);
    }
}

exports.randomActions = async (kswindow) => {
    await state.addUiLog('success' ,'Doing random actions.');
    const rand = Math.round(Math.random() * 100);

    // Random sleep
    if (state.config.randomActions.wait && rand < 10) {
        if (!state.session.running) throw new Error('Bot stopped');
        const randSleep = util.randomIntBetween(2,10);
        await state.addUiLog('success' ,'Doing random action: sleep for ' + randSleep + 's.');
        await sleep(randSleep * 1000);
    }
    
    // Random Click
    if (state.config.randomActions.mouseMoveClick && rand >= 10 && rand < 20) {
        if (!state.session.running) throw new Error('Bot stopped');
        const windowSize = kswindow.workwindow.getView();
        const xCoord = util.randomIntBetween(0.25 * windowSize.width, windowSize.x + 0.75 * windowSize.width);
        const yCoord = util.randomIntBetween(0.25 * windowSize.height, windowSize.x + 0.75 * windowSize.height);
        await kswindow.mouse.humanMoveTo(xCoord,yCoord);
        await randomSleep(300,50);
        await humanClick(kswindow, 'left'); 
    }
}

exports.waitForBlobber = async (kswindow, timeElapsedS) => {
    const startDate = Date.now();
    const timeToWaitS = Math.abs(20 - timeElapsedS);
    let found = false;

    await state.addUiLog('success' ,'Waiting for blobber (' + timeToWaitS + 's left).');
    while ((Date.now() - startDate) / 1000 < timeToWaitS) {
        if (!state.session.running) throw new Error('Bot stopped');

        if (await util.getSystemVolume() > state.config.volumeThreshold) {
            found = true;
            await state.addUiLog('success' ,'Detected blobber trigger.');
            break;
        }

        await sleep(200);
    }

    if (!found) {
        await state.addUiLog('danger' ,'Blobber trigger not detected.');
        await state.updateSession('reelInFails', state.session.reelInFails + 1);
        return;
    }

    if (state.config.reelInMode == 'interact') {
        await randomSleep(600,100);
        await humanSendKey(kswindow,state.config.interactButton);
        
    }
    if (state.config.reelInMode == 'randomClicks') {
        await randomSleep(300,50);
        await reelInRandomClicks(kswindow);
    }

    randomSleep(2000,200);
    return found;
}

const reelInRandomClicks = async (kswindow, key) => {
    // TODO randomClicks reel-in mode
}

const humanSendKey = async (kswindow, key) => {
    await kswindow.keyboard.toggleKey(key, true);
    await randomSleep(100,20);
    await kswindow.keyboard.toggleKey(key, false);
    await randomSleep(200,80);
}

const humanClick = async (kswindow, key) => {
    await kswindow.mouse.toggle(key, true);
    await randomSleep(100,20);
    await kswindow.mouse.toggle(key, false);
    await randomSleep(200,80);
}

const sleepGlobalCooldown = async () => {
    await randomSleep(1700,80);
}