const windows = require('./ui/windows.js');
const state = require('./state.js');
const bot = require('./bot.js');
const util = require('./util/util.js');

const start = async () => {
  await state.initConfig();
  await state.initSession();
  await windows.initMenuWindow();
  await windows.toggleClickWindow();

  bot.start();
}




const test = async () => {
  
}

test();
start();


// TODO
// - Enable and Test electron "non-screenshotable by other apps" option