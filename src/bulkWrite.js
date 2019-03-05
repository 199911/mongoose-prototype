const { assert } = require('chai');

const { MongoMemoryServer } = require('mongodb-memory-server');
const MongooseDriver = require('./drivers/MongooseDriver.js');

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

describe('bulkWrite()', () => {
  let Item;

  beforeEach(() => {
    const itemSchema = new mongoose.Schema({
      a: Number,
      b: Number,
      c: Number,
      doc: {
        e: Number,
        f: Number,
        g: Number,
      },
    });
    Item = mongoose.model('Item', itemSchema);
  });

  context('when item exists', () => {
    const fixture = {
      a: 1,
      b: 2,
      c: 3,
      doc: {
        e: 4,
        f: 5,
      },
    };

    let itemId;

    beforeEach('Setup item', async () => {
      const item = new Item(fixture);
      await item.save();
      itemId = item._id;
    });

    context('when update some fields with updateOne upsert operation', () => {
      const expect = { a: 2, b: 4, c: 6 };
      let ret;

      beforeEach('Run query', async () => {
        ret = await Item.bulkWrite([
          {
            updateOne: {
              filter: { _id: itemId },
              update: expect,
              upsert: true,
            },
          },
        ]);
      });

      it('should update the item', async () => {
        const item = await Item.findById(itemId).lean();
        assert.ownInclude(item, expect);
      });

      it('should return query result object', async () => {
        const expectedRet = {
          result: {
            ok: 1,
            writeErrors: [],
            writeConcernErrors: [],
            insertedIds: [],
            nInserted: 0,
            nUpserted: 0,
            nMatched: 1,
            nModified: 1,
            nRemoved: 0,
            upserted: [],
          },
          insertedCount: 0,
          matchedCount: 1,
          modifiedCount: 1,
          deletedCount: 0,
          upsertedCount: 0,
          upsertedIds: {},
          insertedIds: {},
          n: 0,
        };
        assert.deepOwnInclude(ret, expectedRet);
      });
    });

    context('when update one field with updateOne upsert operation', () => {
      const update = { b: 4 };
      let ret;

      beforeEach('Run query', async () => {
        ret = await Item.bulkWrite([
          {
            updateOne: {
              filter: { _id: itemId },
              update,
              upsert: true,
            },
          },
        ]);
      });

      it('should update one fields and keep other fields unchanged', async () => {
        const expect = { a: 1, b: 4, c: 3 };
        const item = await Item.findById(itemId).lean();
        assert.ownInclude(item, expect);
      });

      it('should match and modify 1 document', async () => {
        assert.equal(ret.matchedCount, 1);
        assert.equal(ret.modifiedCount, 1);
        assert.ownInclude(ret.result, {
          ok: 1,
          nMatched: 1,
          nModified: 1,
        });
      });
    });

    context('when update object with updateOne upsert operation', () => {
      const update = {
        doc: {
          e: 6,
          g: 6,
        },
      };
      let ret;

      beforeEach('Run query', async () => {
        ret = await Item.bulkWrite([
          {
            updateOne: {
              filter: { _id: itemId },
              update,
              upsert: true,
            },
          },
        ]);
      });

      it('should replace the whole object and keep other fields unchanged', async () => {
        const expect = {
          a: 1,
          b: 2,
          c: 3,
          doc: {
            e: 6,
            // f: 5,
            g: 6,
          },
        };
        const item = await Item.findById(itemId).lean();
        assert.deepOwnInclude(item, expect);
        // item.doc.f is removed}
        // whole field `item.doc` is updates, the object is replaced by { e:6, g:6 }
        assert.notExists(item.doc.f);
      });

      it('should match and modify 1 document', async () => {
        assert.equal(ret.matchedCount, 1);
        assert.equal(ret.modifiedCount, 1);
        assert.ownInclude(ret.result, {
          ok: 1,
          nMatched: 1,
          nModified: 1,
        });
      });
    });
  });

  context('when item does not exist', () => {
    context('when update some fields with updateOne upsert operation', () => {
      const filter = { a: 3 };
      const update = { a: 3, b: 6 };
      let ret;

      beforeEach('Run query', async () => {
        ret = await Item.bulkWrite([
          {
            updateOne: {
              filter,
              update,
              upsert: true,
            },
          },
        ]);
      });

      it('should create item', async () => {
        const item = await Item.findOne(filter).lean();
        assert.ownInclude(item, update);
      });

      it('should match and modify 1 document', async () => {
        assert.equal(ret.upsertedCount, 1);
        assert.ownInclude(ret.result, {
          ok: 1,
          nUpserted: 1,
        });
      });

      it('should return upserted id', () => {
        assert.equal(ret.result.upserted.length, 1);
        assert.exists(ret.upsertedIds[0]);
      });
    });
  });
});
