const mongoose = require('mongoose');
const { Mongoose } = require('mongoose');

// @deprecated
const connect = () => {
  return mongoose.createConnection('mongodb://mongo/test');
};

const connectAsync = async ({ uri, name }) => {
  const mongoose = new Mongoose();
  return mongoose.connect(
    uri,
    {
      keepAlive: true,
      dbName: name,
    },
  );
};

const disconnectAsync = async (mongoose) => {
  return mongoose.disconnect();
};

module.exports = {
  connect,
  connectAsync,
  disconnectAsync,
};
