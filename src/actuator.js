const { Hardware, getAllWindows } = require('@io-utils/keysender');
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
    await randomSleep(200,80);
    const fishingStartDate = Date.now();
    await sleepGlobalCooldown();
    
    await exports.customButtons(kswindow, true);

    const timeElapsed = Date.now() - fishingStartDate;
    const waitTimeAfterCastingFish = 1000;
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
        await randomSleep(200,80);

        await randomSleep(customButton.delayMs,customButton.delayMs*0,1);
    }
}

exports.randomActions = async (kswindow) => {
    const rand = Math.round(Math.random() * 100);

    // Wait
    if (state.config.randomActions.wait && rand < 10) {
        if (!state.session.running) throw new Error('Bot stopped');
        const randSleep = util.randomIntBetween(2,10);
        await state.addUiLog('success' ,'Doing random action: sleep for ' + randSleep + 's.');
        await randomSleep(randSleep * 1000, 500);
    }

    // Move Mouse
    if (state.config.randomActions.mouseMove && rand >= 10 && rand < 20) {
        if (!state.session.running) throw new Error('Bot stopped');
        const windowSize = kswindow.workwindow.getView();
        const xCoord = util.randomIntBetween(Math.floor(0.3 * windowSize.width), Math.floor(0.7 * windowSize.width));
        const yCoord = util.randomIntBetween(Math.floor(0.3 * windowSize.height), Math.floor(0.7 * windowSize.height));
        await state.addUiLog('success' ,'Doing random action: mouseMove to (' + xCoord + ',' + yCoord  + ').');
        await kswindow.mouse.humanMoveTo(xCoord,yCoord);
        await randomSleep(300,50);
    }

    // Move Click Mouse
    if (state.config.randomActions.mouseMoveClick && rand >= 20 && rand < 30) {
        if (!state.session.running) throw new Error('Bot stopped');
        const windowSize = kswindow.workwindow.getView();
        const xCoord = util.randomIntBetween(Math.floor(0.3 * windowSize.width), Math.floor(0.7 * windowSize.width));
        const yCoord = util.randomIntBetween(Math.floor(0.3 * windowSize.height), Math.floor(0.7 * windowSize.height));
        await state.addUiLog('success' ,'Doing random action: mouseMoveClick to (' + xCoord + ',' + yCoord  + ').');
        await kswindow.mouse.humanMoveTo(xCoord,yCoord);
        await randomSleep(300,50);
        await humanClick(kswindow, 'left');
        await randomSleep(300,50);
    }

    // Jump
    if (state.config.randomActions.jump && rand >= 40 && rand < 50) {
        await state.addUiLog('success' ,'Doing random action: jump.');
        await humanSendKey(kswindow,'space');
        await randomSleep(2000,150);
    }
}

exports.waitForBlobber = async (kswindow, timeElapsedS) => {
    const startDate = Date.now();
    const timeToWaitS = parseFloat(20 - timeElapsedS).toFixed(3) ;

    await state.addUiLog('success' ,'Waiting for blobber (' + timeToWaitS + 's left).');
    while ((Date.now() - startDate) / 1000 < timeToWaitS) {
        if (!state.session.running) throw new Error('Bot stopped');

        if (await util.getSystemVolume() > state.config.volumeThreshold) {
            await state.addUiLog('success' ,'Detected blobber trigger.');
            return true;
        }

        await sleep(200);
    }


    await state.addUiLog('danger' ,'Blobber trigger not detected.');
    await state.updateSession('reelInFails', state.session.reelInFails + 1);
    await randomSleep(1000,200);

    return false;
}

exports.reelIn = async (kswindow,clickWindow) => {
    if (state.config.reelInMode == 'interact') {
        await randomSleep(600,100);
        await humanSendKey(kswindow,state.config.interactButton);
    }

    if (state.config.reelInMode == 'randomClicks') {
        await randomSleep(300,50);
        await reelInRandomClicks(kswindow);
    }
    await randomSleep(3000,200);
}

const reelInRandomClicks = async (kswindow) => {
    let stepperX,stepperY = 0;
    const set = state.config.randomClicksWindowSettings;
    
    relativeClickWindowPosX = set.posX - kswindow.workwindow.getView().x + 10;
    relativeClickWindowPosY = set.posY - kswindow.workwindow.getView().y + 10;

    
    while (stepperY < set.height) {
        stepperX = 0;
        while (stepperX < set.width) {
            if (!state.session.running) throw new Error('Bot stopped');

            const xCoord = relativeClickWindowPosX + stepperX + util.randomIntBetween(-set.entropy,set.entropy); 
            const yCoord = relativeClickWindowPosY + stepperY + util.randomIntBetween(-set.entropy,set.entropy);
            await kswindow.mouse.humanMoveTo(xCoord,yCoord);
            await humanClick(kswindow, 'right'); 

            stepperX += set.stepX;
        }
        stepperY += set.stepY;
    }
}

const humanSendKey = async (kswindow, key) => {
    await kswindow.keyboard.toggleKey(key, true);
    await randomSleep(100,20);
    await kswindow.keyboard.toggleKey(key, false);
}

const humanClick = async (kswindow, key) => {
    await kswindow.mouse.toggle(key, true);
    await randomSleep(70,10);
    await kswindow.mouse.toggle(key, false);
}

const sleepGlobalCooldown = async () => {
    await randomSleep(1700,80);
}