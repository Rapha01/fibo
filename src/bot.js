const { sleep } = require('./util/util.js');
const state = require('./state.js');
const robot = require('./actuator.js');
const util = require('./util/util.js');

exports.start = async () => {
    await state.addUiLog('warning' ,'Bot initialized.');

    while (true) {
        try {
            if (!state.session.running) {
                await sleep(1000);
                continue;
            }

            if (await isEndDelayOver()) continue;     
            
            if (await isStartDelayActive()) continue;

            await doRound();
    
        } catch (error) { 
            if (state.session.running) {
                console.log(error);
                await state.addUiLog('danger' ,error.message);
            } else
                await state.addUiLog('warning' ,error.message);
            await sleep(1000);
        }
    }
}

const doRound = async () => {
    await state.addUiLog('success' ,'Bot round #' + state.session.round);

    const kswindow = await robot.getWindow(state.config.windowTitle);
    if (!state.session.running) throw new Error('Bot stopped');

    await robot.focusWindow(kswindow);
    if (!state.session.running) throw new Error('Bot stopped');

    const timeElapsedS = await robot.castFishAndInFishCustomButtons(kswindow);
    if (!state.session.running) throw new Error('Bot stopped');

    await robot.waitForBlobber(kswindow, timeElapsedS);
    if (!state.session.running) throw new Error('Bot stopped');

    await robot.customButtons(kswindow,false);
    if (!state.session.running) throw new Error('Bot stopped');
    
    await robot.randomActions(kswindow);
    if (!state.session.running) throw new Error('Bot stopped');

    /*await robot.test(kswindow);
    if (!state.session.running) throw new Error('Bot stopped');
    await sleep(1000);*/
    
    await state.updateSession('round',state.session.round + 1);
}

const isStartDelayActive = async () => {
    const timeUntilStart = (-1) * (Date.now() - state.session.startedAt - state.config.startDelayM * 60 * 1000);

    if (timeUntilStart > 0) {
        await state.addUiLog('warning' ,'Waiting for start for another ' + Math.ceil(timeUntilStart/1000/60) + 'm');

        await sleep(3000);
        return true;
    }

    return false;
}

const isEndDelayOver = async () => {
    if (state.config.endDelayM == 0)
        return false

    const ranForS = (Date.now() - state.session.startedAt) / 1000 - (state.config.startDelayM * 60);
    const timeUntilEnd = state.config.endDelayM * 60 - ranForS;

    if (timeUntilEnd < 0) {
        await state.addUiLog('warning' ,'Bot ran for ' + util.secondsToDigitalClock(Math.floor(ranForS)) + ' and stops due to set end delay.');
        await state.updateSession('running', false);

        await sleep(1000);
        return true;
    }

    return false;
}