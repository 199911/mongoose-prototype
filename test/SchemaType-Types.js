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
    assert.notEqual(SchemaTypeObjectId, TypeObjectId);
  });

  it('Instance ObjectId is Types.ObjectId', () => {
    assert.notEqual(mongoose.ObjectId, TypeObjectId);
  });

  describe('when we have a document', () => {
    let Kitten;
    let inMemoryDoc;
    beforeEach('Setup document', async () => {
      const kittySchema = new mongoose.Schema({
        name: String,
      });
      Kitten = mongoose.model('Kitten', kittySchema);
      inMemoryDoc = await Kitten.create({ name: 'slience' });
    });

    it('id in memory doc is Types.ObjectId', async () => {
      assert.instanceOf(inMemoryDoc._id, TypeObjectId);
      assert.notInstanceOf(inMemoryDoc._id, SchemaTypeObjectId);
    });

    it('id of doc return from db is Types.ObjectId', async () => {
      const doc = await Kitten.findOne({});
      assert.instanceOf(doc._id, TypeObjectId);
      assert.notInstanceOf(doc._id, SchemaTypeObjectId);
    });
  });
});
