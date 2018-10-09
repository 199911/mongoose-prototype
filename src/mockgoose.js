const { Schema } = require('mongoose');
const { assert } = require('chai');

const { setup, tearDown, reset } = require('./drivers/mockgoose.js');
const { connect } = require('./drivers/mongoose.js');

const item = new Schema({
  code: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
  },
});

before(async () => {
  await setup();
});

after(async () => {
  await tearDown();
});

describe('reuse connection after reset mockgoose', () => {
  let conn, Item;

  before(async () => {
    conn = connect();
    Item = conn.model('Item', item);
  });

  afterEach(async () => {
    await reset();
  });

  it('should throw duplicated error', async () => {
    let err
    const c = new Item({
      code: 1,
      name: 'computer',
    })
    await c.save();
    try {
      const m = new Item({
        code: 1,
        name: 'mouse',
      })
      await m.save();
    } catch (e) {
      err = e;
    }
    assert.isOk(err, 'should throw duplicated error');
  });

  it('should throw duplicated error', async () => {
    let err
    const c = new Item({
      code: 1,
      name: 'computer',
    })
    await c.save();
    try {
      const m = new Item({
        code: 1,
        name: 'mouse',
      })
      await m.save();
    } catch (e) {
      err = e;
    }
    assert.isOk(err, 'should throw duplicated error');
  });

});

describe('create new connection after reset mockgoose', () => {
  let conn, Item;

  beforeEach(async () => {
    conn = connect();
    Item = conn.model('Item', item);
  });

  afterEach(async () => {
    await reset();
  });

  it('should throw duplicated error', async () => {
    let err
    const c = new Item({
      code: 1,
      name: 'computer',
    })
    await c.save();
    try {
      const m = new Item({
        code: 1,
        name: 'mouse',
      })
      await m.save();
    } catch (e) {
      err = e;
    }
    assert.isOk(err, 'should throw duplicated error');
  });

  it('should throw duplicated error', async () => {
    let err
    const c = new Item({
      code: 1,
      name: 'computer',
    })
    await c.save();
    try {
      const m = new Item({
        code: 1,
        name: 'mouse',
      })
      await m.save();
    } catch (e) {
      err = e;
    }
    assert.isOk(err, 'should throw duplicated error');
  });

});
