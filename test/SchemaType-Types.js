const { assert } = require('chai');

const { MongoMemoryServer } = require('mongodb-memory-server');
const MongooseDriver = require('../drivers/MongooseDriver.js');

let mongoMemoryServer;
let mongoose;
let mongooseDriver;

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
  mongooseDriver = new MongooseDriver(uri, name);
  mongoose = await mongooseDriver.connectAsync();
});

afterEach('Tear down mongoose', async () => {
  await mongooseDriver.resetAsync();
  await mongooseDriver.disconnectAsync();
});

describe('SchemaType vs Type', () => {
  let SchemaTypeObjectId;
  let TypeObjectId;

  beforeEach('Setup SchemaType ObjectId and Type ObjectId', () => {
    SchemaTypeObjectId = mongoose.Schema.Types.ObjectId;
    TypeObjectId = mongoose.Types.ObjectId;
  });

  it('Schema.Types.ObjectId is different from Types.ObjectId', () => {
    assert.notEqual(SchemaTypeObjectId, TypeObjectId)
  });

  it('Instance ObjectId is Types.ObjectId', () => {
    assert.notEqual(mongoose.ObjectId, TypeObjectId)
  });
});
