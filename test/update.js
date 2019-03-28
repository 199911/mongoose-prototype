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

// Update and field with value undefined is different from update field not defined
// first one set field to null and second does not update the field

describe('Update test', () => {
  let Kitten;
  let kittenDoc;
  const fixture = { name: 'Silence', age: 3 };

  beforeEach('Setup models', () => {
    const kittySchema = new mongoose.Schema({
      name: String,
      age: Number,
    });
    Kitten = mongoose.model('Kitten', kittySchema);
  });

  beforeEach('Setup kitten', async () => {
    kittenDoc = await Kitten.create(fixture);
  });

  context('when set name to undefined in update data', () => {
    it('should set name to null in collection when use document.update()', async () => {
      await kittenDoc.update({ name: undefined, age: 2 });
      const actual = await Kitten.findOne({});
      assert.equal(actual.name, null);
    });
    it('should set name to null in collection when use findOneAndUpdate()', async () => {
      await Kitten.findOneAndUpdate({name: 'Silence'}, { name: undefined, age: 4 });
      const actual = await Kitten.findOne({});
      assert.equal(actual.name, null);
    });
  });

  context('when name is not defined in update data', () => {
    it('should not update name in collection when use document.update()', async () => {
      await kittenDoc.update({ age: 2 });
      const actual = await Kitten.findOne({});
      assert.equal(actual.name, 'Silence');
    });
    it('should not update name in collection when use findOneAndUpdate()', async () => {
      await Kitten.findOneAndUpdate({name: 'Silence'}, { age: 4 });
      const actual = await Kitten.findOne({});
      assert.equal(actual.name, 'Silence');
    });
  });
});
