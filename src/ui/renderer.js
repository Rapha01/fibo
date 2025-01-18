const numberOfCustomButtons = 6;
const customButtonFields = ['label','active','button','intervalS','delayMs','inFishCast','runAtStart'];
const randomClicksWindowSettingsFields = ['posX','posY','width','height','stepX','stepY','entropy'];
const randomActionsFields = ['mouseMoveClick','wait','jump'];
let volumeMeterTestActive = false;

const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const startVolumeMeterTestButton = document.getElementById('startVolumeMeterTestButton');
const stopVolumeMeterTestButton = document.getElementById('stopVolumeMeterTestButton');
const volumeMeterTestValueDiv = document.getElementById('volumeMeterTestValue');
const volumeMeterTestMaxValueDiv = document.getElementById('volumeMeterTestMaxValue');
const randomClicksWindowSettingsDiv = document.getElementById('randomClicksWindowSettingsDiv');
const interactSettingsDiv = document.getElementById('interactSettingsDiv');


/*
 * Helper functions
*/

function sleep (ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

const format_time = (timestamp) => {
    const dtFormat = new Intl.DateTimeFormat('en-GB', {
        timeStyle: 'medium', //timeZone: 'UTC'
    });
    
    return dtFormat.format(new Date(timestamp * 1e3));
}

const showStartButton = () => {
    stopButton.classList.remove("d-block");
    stopButton.classList.add("d-none");
    startButton.classList.remove("d-none");
    startButton.classList.add("d-block");
};
const showStopButton = () => {
    startButton.classList.remove("d-block");
    startButton.classList.add("d-none");
    stopButton.classList.remove("d-none");
    stopButton.classList.add("d-block");
};
const showStartVolumeMeterTestButton = () => {
    stopVolumeMeterTestButton.classList.remove("d-block");
    stopVolumeMeterTestButton.classList.add("d-none");
    startVolumeMeterTestButton.classList.remove("d-none");
    startVolumeMeterTestButton.classList.add("d-block");
};
const showStopVolumeMeterTestButton = () => {
    startVolumeMeterTestButton.classList.remove("d-block");
    startVolumeMeterTestButton.classList.add("d-none");
    stopVolumeMeterTestButton.classList.remove("d-none");
    stopVolumeMeterTestButton.classList.add("d-block");
};
const showInteractButtonSettings = () => {
    randomClicksWindowSettingsDiv.classList.remove("d-block");
    randomClicksWindowSettingsDiv.classList.add("d-none");
    interactSettingsDiv.classList.remove("d-none");
    interactSettingsDiv.classList.add("d-block");
};

const showRandomClicksWindowSettings = () => {
    randomClicksWindowSettingsDiv.classList.remove("d-none");
    randomClicksWindowSettingsDiv.classList.add("d-block");
    interactSettingsDiv.classList.remove("d-block");
    interactSettingsDiv.classList.add("d-none");
};


const getConfigCustomStateElements = () => {
    const customButtons = [];
    for (let id= 0; id < numberOfCustomButtons; id++) {
        const obj = {};
        for (const field of customButtonFields) {
            const element = document.getElementById('configCustomStateElement' + id + '_' + field);
            if (element.type == 'checkbox') obj[field] = element.checked;
            else obj[field] = element.value;
        }
        customButtons.push(obj);
    }
    return customButtons;
}

const getRandomClicksWindowSettingsElements = () => {
    const obj = {};
    for (const field of randomClicksWindowSettingsFields) {
        const element = document.getElementById('randomClicksWindowSettingsElement_' + field);
        obj[field] = element.value;
    }

    return obj;
}

const getRandomActionsElements = () => {
    const obj = {};
    for (const field of randomActionsFields) {
        const element = document.getElementById('randomActions_' + field);
        if (element.type == 'checkbox') obj[field] = element.checked;
        else obj[field] = element.value;
    }

    return obj;
}

const secondsToDigitalClock = (secondsElapsed) => {
    let seconds = (secondsElapsed % 60);
    let minutes = (Math.floor(secondsElapsed / 60) % 60);
    let hours = (Math.floor(secondsElapsed / 60 / 60));

    if (seconds < 10) seconds = '0' + seconds.toString();
    if (minutes < 10) minutes = '0' + minutes.toString();
    if (hours < 10) hours = '0' + hours.toString();

    return hours + ' : ' + minutes + ' : ' + seconds;
}

/*
 * Initialize state
*/

const initState = async () => {
    const state = await window.electronAPI.typeMessage({type: 'getState'});

    for (const element of document.getElementsByClassName('configStateElement')) {
        if (element.type == 'checkbox')
            element.checked = state.config[element.id];
        else
            element.value = state.config[element.id];
    }

    if (state.config.reelInMode == 'interact')
        showInteractButtonSettings();
    if (state.config.reelInMode == 'randomClicks')
        showRandomClicksWindowSettings();

    for (const element of document.getElementsByClassName('sessionStateElement')) {
        if (element.type == 'checkbox')
            element.checked = state.session[element.id];
        else 
            element.value = state.session[element.id];
    }

    for (let id= 0; id < state.config.customButtons.length; id++) {
        for (const field of customButtonFields) {
            const element = document.getElementById('configCustomStateElement' + id + '_' + field);
            if (element.type == 'checkbox')
                element.checked = state.config.customButtons[id][field];
            else 
                element.value = state.config.customButtons[id][field];
        }
    }

    for (const field of randomClicksWindowSettingsFields) {
        const element = document.getElementById('randomClicksWindowSettingsElement_' + field);
        element.value = state.config.randomClicksWindowSettings[field];
    }

    for (const field of randomActionsFields) {
        const element = document.getElementById('randomActions_' + field);
        if (element.type == 'checkbox')
            element.checked = state.config.randomActions[field];
        else 
            element.value = state.config.randomActions[field];
    }
}
initState();

/*
 * EventListener
*/

startButton.addEventListener('click', async () => {
    const response = await window.electronAPI.typeMessage({type: 'updateSessionState', field: 'running',value: true});
});

stopButton.addEventListener('click', async () => {
    const response = await window.electronAPI.typeMessage({type: 'updateSessionState', field: 'running',value: false});
});

startVolumeMeterTestButton.addEventListener('click', async () => {
    volumeMeterTestActive = true;
    let volumeMeterTestMaxValue = 0;
    showStopVolumeMeterTestButton();

    while (volumeMeterTestActive) {
        const response = await window.electronAPI.typeMessage({type: 'getSystemVolume'});
        volumeMeterTestValueDiv.innerText = parseFloat(response).toFixed(3);
        if (response > volumeMeterTestMaxValue) {
            volumeMeterTestMaxValue = response;
            volumeMeterTestMaxValueDiv.innerText = parseFloat(response).toFixed(3);
        }
        await sleep(200);
    }
});

stopVolumeMeterTestButton.addEventListener('click', async () => {
    volumeMeterTestActive = false;
    showStartVolumeMeterTestButton();
    volumeMeterTestValue.innerText = '';
});

for (const element of document.getElementsByClassName('configStateElement')) {
    element.addEventListener('change', async (el) => {
        if(element.id == 'reelInMode') {
            if (element.value == 'interact')
                showInteractButtonSettings();
            if (element.value == 'randomClicks')
                showRandomClicksWindowSettings();
        }

        if (element.type == 'checkbox')
            await window.electronAPI.typeMessage({type: 'updateConfigState', field: element.id, value: element.checked});
        else 
            await window.electronAPI.typeMessage({type: 'updateConfigState', field: element.id, value: element.value});
    })
}

for (const element of document.getElementsByClassName('sessionStateElement')) {
    element.addEventListener('change', async (el) => {
        if (element.type == 'checkbox')
            await window.electronAPI.typeMessage({type: 'updateSessionState', field: element.id, value: element.checked});
        else 
            await window.electronAPI.typeMessage({type: 'updateSessionState', field: element.id, value: element.value});
    })
}

for (let id= 0; id < numberOfCustomButtons; id++) {
    for (let field of customButtonFields) {
        const element = document.getElementById('configCustomStateElement' + id + '_' + field);
        element.addEventListener('change', async (el) => {
            const response = await window.electronAPI.typeMessage({type: 'updateConfigState', field: 'customButtons', value: getConfigCustomStateElements()});
        })
    }
}

for (let field of randomClicksWindowSettingsFields) {
    const element = document.getElementById('randomClicksWindowSettingsElement_' + field);
    element.addEventListener('change', async (el) => {
        const response = await window.electronAPI.typeMessage({type: 'updateConfigState', field: 'randomClicksWindowSettings', value: getRandomClicksWindowSettingsElements()});
    })
}

for (let field of randomActionsFields) {
    const element = document.getElementById('randomActions_' + field);
    element.addEventListener('change', async (el) => {
        const response = await window.electronAPI.typeMessage({type: 'updateConfigState', field: 'randomActions', value: getRandomActionsElements()});
    })
}


/*
 * Update functions
*/


async function updateLog(log) {
    const logs = await window.electronAPI.typeMessage({type: 'popUiLogs'});
    const logScrollUl = document.getElementById('logScrollUl');

    for (const log of logs) {
        const newLi = document.createElement("li");
        let colorClass = 'text-light';
        if (log.level == 'success') colorClass = 'text-white';
        if (log.level == 'warning') colorClass = 'text-warning';
        if (log.level == 'info') colorClass = 'text-info';
        if (log.level == 'danger') colorClass = 'text-danger';
        newLi.classList.add(colorClass);
        newLi.style = 'text-shadow: 2px 2px 5px #000000';
        newLi.innerHTML = format_time(log.addDate / 1000) + ' &nbsp;&nbsp;&nbsp; ' + log.message;
        logScrollUl.appendChild(newLi);
    }

    const logScrollDiv = document.getElementById('logScrollDiv');
    if (logs.length > 0)
        logScrollDiv.scrollTop = logScrollDiv.scrollHeight;
}

async function updateSessionState() {
    const state = await window.electronAPI.typeMessage({type: 'getState'});
    const timeElapsedS = Math.floor((Date.now() - state.session.startedAt) / 1000);
    
    const stats_statusDiv = document.getElementById('stats_status');
    const stats_timeRunningDiv = document.getElementById('stats_timeRunning');
    const stats_roundDiv = document.getElementById('stats_round');
    const stats_roundsPerHourDiv = document.getElementById('stats_roundsPerHour');
    const stats_reelInFailsDiv = document.getElementById('stats_reelInFails');

    if (state.session.running) {
        showStopButton();
        stats_statusDiv.innerHTML = '<svg xmlns="./src/ui/assets/circle-fill.svg" width="11" height="11" fill="#157347" class="bi bi-circle-fill" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8"/></svg> Running';
        stats_timeRunningDiv.innerText = secondsToDigitalClock(timeElapsedS);
        stats_roundDiv.innerText = state.session.round;
        const roundsPerHour = Math.floor((state.session.round - 1) / (timeElapsedS / 60 / 60));
        stats_roundsPerHourDiv.innerText = isNaN(roundsPerHour) ? '0' : roundsPerHour;
        stats_reelInFailsDiv.innerText = Math.floor((state.session.reelInFails / state.session.round) * 100) + '%';
    } else {
        showStartButton();
        stats_statusDiv.innerHTML = '<svg xmlns="./src/ui/assets/circle-fill.svg" width="11" height="11" fill="#BB2D3B" class="bi bi-circle-fill" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8"/></svg> Not running';
        stats_timeRunningDiv.innerText = '00 : 00 : 00';
    }
}

async function updatePolling() {
    while (true) {
        await sleep(200);
        await updateSessionState();
        await updateLog();
    }
}
updatePolling();

