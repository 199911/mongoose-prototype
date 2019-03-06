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

describe('populate()', () => {
  let Person;
  let Story;

  beforeEach('Setup model', async () => {
    const personSchema = new mongoose.Schema({
      name: String,
      age: Number,
      stories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Story' }],
    });
    const storySchema = new mongoose.Schema({
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
      title: String,
      fans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
    });
    Person = mongoose.model('Person', personSchema);
    Story = mongoose.model('Story', storySchema);
  });

  beforeEach('Setup document', async () => {
    const author = new Person({
      name: 'Ian Fleming',
      age: 50,
    });
    await author.save();
    const story = new Story({
      title: 'Casino Royale',
      // assign the _id from the person
      author: author._id,
    });
    await story.save();
  });

  it('should populate person in story.author', async () => {
    const story = await Story
      .findOne({ title: 'Casino Royale' })
      .populate('author')
      .exec();
    assert.equal(story.author.name, 'Ian Fleming');
  });

  // Conclusion: don't try to update populated object by set() from host object;
  context('when we update populated object author by story.set({ author: { ... } })', () => {
    it('will create a new populated object', async () => {
      const story = await Story
        .findOne({ title: 'Casino Royale' })
        .populate('author')
        .exec();
      const originAuthorId = story.author._id.toString();
      story.set({ author: { name: 'Sunday' } });
      // A new object is created here
      assert.notEqual(story.author._id.toString(), originAuthorId);
    });
  });

  context('when we call story.set("author.name", value)', () => {
    it('will not update author object', async () => {
      const story = await Story
        .findOne({ title: 'Casino Royale' })
        .populate('author')
        .exec();
      const originAuthorId = story.author._id.toString();
      story.set('author.name', 'Sunday');

      // Populated object will not be updated
      assert.equal(story.author._id.toString(), originAuthorId);
      assert.equal(story.author.name, 'Ian Fleming');
    });
  });

  context('when we create a new populated object author in story', () => {
    beforeEach(async () => {
      const story = await Story
        .findOne({ title: 'Casino Royale' })
        .populate('author')
        .exec();
      story.author = new Person({
        name: 'Sunday',
        age: 999,
      });
      await story.save();
    });

    it('does not save populated object automatically', async () => {
      const myStory = await Story
        .findOne({ title: 'Casino Royale' })
        .exec();
      assert.isNotNull(myStory.author);

      const myPopulatedStory = await Story
        .findOne({ title: 'Casino Royale' })
        .populate('author')
        .exec();
      assert.isNull(myPopulatedStory.author);
    });
  });

  it('should update person in story.author when we call author.save(), without story.save()', async () => {
    const story = await Story
      .findOne({ title: 'Casino Royale' })
      .populate('author')
      .exec();
    const { author } = story;
    author.set({
      name: 'Sunday',
      age: 999,
    });
    await author.save();

    const myPopulatedStory = await Story
      .findOne({ title: 'Casino Royale' })
      .populate('author')
      .exec();

    assert.equal(author._id.toString(), story.author._id.toString());
    assert.equal(author.name, 'Sunday');
  });
});
