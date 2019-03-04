const { assert } = require('chai');

const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectAsync, disconnectAsync, resetAsync } = require('./drivers/mongoose.js');

let mongoMemoryServer;
let mongoose;

before('Setup Mock MongoDB', async () => {
  mongoMemoryServer = new MongoMemoryServer({
    autoStart: false,
  });
  await mongoMemoryServer.start();
});

after('Teardown Mock MongoDB', async () => {
  mongoMemoryServer.stop();
});

beforeEach('Setup mongoose', async () => {
  const uri = await mongoMemoryServer.getConnectionString();
  const name = 'jest';
  mongoose = await connectAsync({ uri, name });
});

afterEach('Tear down mongoose', async () => {
  await disconnectAsync(mongoose);
});

describe('Basic test', () => {

  let Kitten;
  const fixture = { name: 'Silence' };

  beforeEach('Setup models', () => {
    const kittySchema = new mongoose.Schema({
      name: String
    });
    Kitten = mongoose.model('Kitten', kittySchema);
  });

  beforeEach('Setup kitten', async () => {
    silence = await Kitten.create(fixture);
  });

  it('should find a kitten name slience', async () => {
    const kitten = await Kitten.findOne(fixture);
    assert.include(kitten, fixture);
  });
});
