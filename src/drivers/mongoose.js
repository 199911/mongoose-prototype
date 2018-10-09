const mongoose = require('mongoose');

const connect = () => {
  return mongoose.createConnection('mongodb://mongo/test');
}

module.exports = {
  connect
};
