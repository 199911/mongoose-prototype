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

describe('sub-documents', () => {
  let Parent;
  let parent;
  let childId;

  beforeEach('Setup model', async () => {
    const childSchema = new mongoose.Schema({
      name: 'string',
      age: Number,
    });
    const parentSchema = new mongoose.Schema({
      name: String,
      age: Number,
      children: [childSchema],
      child: childSchema,
    });
    Parent = mongoose.model('Parent', parentSchema);
  });

  beforeEach('Setup document', async () => {
    parent = new Parent({
      name: 'Mum',
      children: [
        {
          name: 'Matt',
          age: 22,
        },
        {
          name: 'Sarah',
          age: 18,
        },
      ],
      child: {
        name: 'Matt',
        age: 22,
      },
    });
    await parent.save();
    childId = parent.child._id;
  });

  // We can update sub document with path1.path2
  context('when update child with dot notation (child.name)', () => {
    it('should update child name only', async () => {
      parent.set('child.name', 'Sunday');
      await parent.save();

      const myParent = await Parent
        .findOne({ name: 'Mum' })
        .lean()
        .exec();
      // No new child is created
      assert.equal(myParent.child._id.toString(), childId.toString());
      assert.ownInclude(myParent.child, { name: 'Sunday', age: 22 });
    });
  });

  // We can update sub document with path1.path2, but the other field in child got removed
  context('when update child with object notation (child: { name })', () => {
    it('should replace the whole child object', async () => {
      parent.set({ child: { name: 'Sunday' } });
      await parent.save();

      const myParent = await Parent
        .findOne({ name: 'Mum' })
        .lean()
        .exec();

      // Note: New sub-document will be created, as we set an object to sub-document
      // Id is different as it is a new object
      assert.notEqual(myParent.child._id.toString(), childId.toString());
      assert.ownInclude(myParent.child, { name: 'Sunday' });
      // age is undefined, as the whold child object is replaced
      assert.isUndefined(myParent.child.age);
    });
  });

  // We have to call parent.save() to update sub-document
  context('when call child.save()', () => {
    it('will not update parent.child', async () => {
      const { child } = parent;
      child.set({ name: 'Sunday' });
      // Suppress warning on child.save does not update parent.child
      await child.save({ suppressWarning: true });

      const myParent = await Parent
        .findOne({ name: 'Mum' })
        .exec();

      assert.equal(myParent.child._id.toString(), childId.toString());
      assert.equal(myParent.child.name, 'Matt');
    });
  });

  // child.set will mark the field dirty, so parent.save() will update the record
  context('when call child.set() and parent.save()', () => {
    it('will update parent.child', async () => {
      const { child } = parent;
      child.set({ name: 'Sunday' });
      await parent.save();

      const myParent = await Parent
        .findOne({ name: 'Mum' })
        .exec();

      assert.equal(myParent.child._id.toString(), childId.toString());
      assert.equal(myParent.child.name, 'Sunday');
      assert.equal(myParent.child.age, 22);
    });
  });

  // We can update sub document in array with path1.index
  context('when call parent.set("children.1.name", value)', () => {
    it('should update child', async () => {
      parent.set('children.1.name', 'Sunday');
      await parent.save();

      const myParent = await Parent
        .findOne({ name: 'Mum' })
        .exec();

      assert.equal(myParent.children[1].name, 'Sunday');
      assert.equal(myParent.children[1].age, 18);
    });
  });
});
