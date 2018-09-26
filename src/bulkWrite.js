const { Schema } = require('mongoose');
const { assert } = require('chai');

const { connect } = require('./driver.js');

DEBUG = true;

const item = new Schema({
  a: Number,
  b: Number,
  c: Number,
  doc: {
    e: Number,
    f: Number,
    g: Number,
  }
});

describe('bulkWrite() with updateOne upsert operation', () => {
  let conn, Item;

  beforeEach(() => {
    conn = connect();
    Item = conn.model('Item', item);
  });

  afterEach(async () => {
    await Item.remove();
    conn.close();
  });

  context('when item exists', () => {

    beforeEach(async () => {
      const i = new Item({
        a: 1,
        b: 2,
        c: 3,
      })
      await i.save();
    })

    it('should update the item', async () => {
      const expect = { a:1, b:4, c:6 };
      const before = await Item.findOne({a:1}).lean();
      const {
        insertedCount,
        matchedCount,
        modifiedCount,
        deletedCount,
        upsertedCount,
        upsertedIds,
        insertedIds,
      } = await Item.bulkWrite([
        {
          updateOne: {
            filter: { a: 1 },
            update: {
              b: 4,
              c: 6,
            },
            upsert: true,
          }
        }
      ]);
      const after = await Item.findOne({a:1}).lean();
      assert.ownInclude(after, expect)
      if (DEBUG) {
        console.log({
          insertedCount,
          matchedCount,
          modifiedCount,
          deletedCount,
          upsertedCount,
          upsertedIds,
          insertedIds,
        });
        console.log(before);
        console.log(after);
        console.log(expect);
      }
    });

  });

  context('when update partial item', () => {
    beforeEach(async () => {
      const i = new Item({
        a: 1,
        b: 2,
        c: 3,
      })
      await i.save();
    })

    it('should update item and keep other fields unchanged', async () => {
      const expect = { a:1, b:4 };
      const before = await Item.findOne({a:1}).lean();
      const {
        insertedCount,
        matchedCount,
        modifiedCount,
        deletedCount,
        upsertedCount,
        upsertedIds,
        insertedIds,
      } = await Item.bulkWrite([
        {
          updateOne: {
            filter: { a: 1 },
            update: {
              b: 4,
            },
            upsert: true,
          }
        }
      ]);
      const after = await Item.findOne({a:1}).lean();
      if (DEBUG) {
        console.log({
          insertedCount,
          matchedCount,
          modifiedCount,
          deletedCount,
          upsertedCount,
          upsertedIds,
          insertedIds,
        });
        console.log(before);
        console.log(after);
        console.log(expect);
      }
      assert.ownInclude(after, expect);
    });
  });

  context('when item does not exists', () => {
    it('should update item and keep other fields unchanged', async () => {
      const expect = { a: 3, b:6 };
      const before = await Item.findOne({a:3}).lean();
      const res = await Item.bulkWrite([
        {
          updateOne: {
            filter: { a: 3 },
            update: {
              b: 6,
            },
            upsert: true,
          }
        }
      ]);
      const {
        insertedCount,
        matchedCount,
        modifiedCount,
        deletedCount,
        upsertedCount,
        upsertedIds,
        insertedIds,
      } = res;
      const after = await Item.findOne({a:3}).lean();
      if (DEBUG) {
        console.log({
          insertedCount,
          matchedCount,
          modifiedCount,
          deletedCount,
          upsertedCount,
          upsertedIds,
          insertedIds,
        });
        console.log(before);
        console.log(after);
        console.log(expect);
      }
      assert.ownInclude(after, expect);
    });
  });

  context('when update partial sub-document in item', () => {
    beforeEach(async () => {
      const i = new Item({
        a: 999,
        doc: {
          e: 6,
          f: 8,
          g: 9,
        }
      })
      await i.save();
    })

    it('should update sub-document and keep other fields unchanged', async () => {
      const expect = {
        a: 999,
        doc: {
          e: 6,
          f: 6,
          g: 6,
        }
      };
      const before = await Item.findOne({a: 999}).lean();
      const {
        insertedCount,
        matchedCount,
        modifiedCount,
        deletedCount,
        upsertedCount,
        upsertedIds,
        insertedIds,
      } = await Item.bulkWrite([
        {
          updateOne: {
            filter: { a: 999 },
            update: {
              'doc.f': 6,
              'doc.g': 6,
            },
            upsert: true,
          }
        }
      ]);
      const after = await Item.findOne({a: 999}).lean();
      if (DEBUG) {
        console.log({
          insertedCount,
          matchedCount,
          modifiedCount,
          deletedCount,
          upsertedCount,
          upsertedIds,
          insertedIds,
        });
        console.log(before);
        console.log(after);
        console.log(expect);
      }
      assert.deepOwnInclude(after, expect);
    });
  });

});
