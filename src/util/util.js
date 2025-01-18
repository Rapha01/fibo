const exec = require('child_process').execFile;

exports.sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
};

exports.randomIntBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

exports.gaussianRandom = (mean=0, stdev=1) => {
  const u = 1 - Math.random(); // Converting [0,1) to (0,1]
  const v = Math.random();
  const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
  const result = z * stdev + mean;

  return result;
}

exports.randomSleep = async (meanMs,stdevMs) => {
  let ms = await exports.gaussianRandom(meanMs,stdevMs);
  let tries = 0;

  while (ms < meanMs - 2 * stdevMs || ms > meanMs + 4 * stdevMs || ms < 0) {
    if (tries > 20) return;
    ms = await exports.gaussianRandom(meanMs,stdevMs);
    tries++;
  }

  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const execute = async (fileName, params, path) => {
  return new Promise((resolve, reject) => {
    exec(fileName, params, { cwd: path }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
    });
  });
}

exports.getSystemVolume = async () => {
    const volume = await execute('ahkGetVolume.exe',[],'src/ahkGetVolume');

    return parseFloat(volume);
}

exports.secondsToDigitalClock = (secondsElapsed) => {
  let seconds = (secondsElapsed % 60);
  let minutes = (Math.floor(secondsElapsed / 60) % 60);
  let hours = (Math.floor(secondsElapsed / 60 / 60));

  if (seconds < 10) seconds = '0' + seconds.toString();
  if (minutes < 10) minutes = '0' + minutes.toString();
  if (hours < 10) hours = '0' + hours.toString();

  return hours + ' : ' + minutes + ' : ' + seconds;
}