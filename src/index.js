const mongoose = require('mongoose');
const { main: subdoc } = require('./subdoc.js');

const main = async () => {
  let ret;
  mongoose.set('debug', true);
  mongoose.connect('mongodb://mongo/test');
  await subdoc();
  mongoose.disconnect();
}

main();
