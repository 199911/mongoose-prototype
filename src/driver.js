const mongoose = require('mongoose');

const connect = () => {
  mongoose.set('debug', true);
  return mongoose.createConnection('mongodb://mongo/test');
}

module.exports = {
  connect
};
