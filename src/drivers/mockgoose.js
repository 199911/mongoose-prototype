const mongoose = require('mongoose');
const { Mockgoose } = require('mockgoose');

let mockgoose;

const setup = async () => {
  if (!mockgoose) {
    mockgoose = new Mockgoose(mongoose);
    await mockgoose.prepareStorage();
  }
}

const tearDown = async () => {
  if (mockgoose) {
    await mongoose.disconnect();
    mockgoose.mongodHelper.mongoBin.childProcess.kill('SIGKILL');
  }
}

const reset = async () => {
  await mockgoose.helper.reset();
}

module.exports = {
  setup,
  tearDown,
  reset,
};
