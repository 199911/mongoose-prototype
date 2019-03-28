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

// Doc: https://mongoosejs.com/docs/api.html#document_Document-toObject
// toObject will be called automatically
// toJSON alter console.log() behaviour:
// https://stackoverflow.com/questions/17546953/cant-access-object-property-even-though-it-exists-returns-undefined#comment66164138_36522374
//
// Conclusion: toObject transform only apply when explicitly calling toObject()
//   It will not apply when calling lean() or aggregate
describe('Transform option in toObject() test', () => {
  let Kitten;
  const fixture = { name: 'Silence' };

  beforeEach('Setup models with toObject and toJSON options', () => {
    const kittySchema = new mongoose.Schema({
      name: String,
    }, {
      toObject: {
        transform: (doc, ret) => {
          ret.greeting = 'Meow~~~(Object version)';
          return ret;
        },
        versionKey: false,
      },
      toJSON: {
        transform: (doc, ret) => {
          ret.greeting = 'Meow~~~(JSON version)';
          return ret;
        },
        versionKey: false,
      },
    });
    Kitten = mongoose.model('Kitten', kittySchema);
  });

  beforeEach('Setup kitten', async () => {
    await Kitten.create(fixture);
  });

  it('should NOT have toObject options applied to documents', async () => {
    const kitten = await Kitten.findOne(fixture).exec();
    assert.isUndefined(kitten.greeting);
    assert.isDefined(kitten.__v);
  });

  it('should have toObject options applied after calling toObject()', async () => {
    const kitten = await Kitten.findOne(fixture).exec();
    const kittenObject = kitten.toObject();
    assert.equal(kittenObject.greeting, 'Meow~~~(Object version)');
    assert.isUndefined(kittenObject.__v);
  });

  it('should NOT have toObject options applied when calling lean()', async () => {
    const kitten = await Kitten.findOne(fixture).lean().exec();
    assert.equal(kitten.name, 'Silence');
    assert.isDefined(kitten.__v);
    assert.isDefined(kitten._id);
  });

  it('should NOT have toObject options applied when using aggregate()', async () => {
    const [kitten] = await Kitten.aggregate().match({ name: 'Silence' }).exec();
    assert.equal(kitten.name, 'Silence');
    assert.isDefined(kitten.__v);
    assert.isDefined(kitten._id);
  });
});
