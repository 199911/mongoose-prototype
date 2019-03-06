/**
 * Conclusion:
 * - You cannot create / update populated object by set() from host object
 * - You new populated model will not be saved to DB automatically
 * - story.set({ author: { ... } }) should be same as story.author = new Person({ ... })
 */


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

  context('when populate author', () => {
    let story;
    beforeEach('Populate author', async () => {
      story = await Story
        .findOne({ title: 'Casino Royale' })
        .populate('author')
        .exec();
    });
    it('should story.author should be an object with field "name"', async () => {
      assert.equal(story.author.name, 'Ian Fleming');
    });

    context('when we set populated object with dot notation (author.name)', () => {
      it('will not update story.author object in memory', async () => {
        const originAuthorId = story.author._id.toString();
        story.set('author.name', 'Sunday');

        // Populated object cannot be updated by .set() with dot notation
        assert.equal(story.author._id.toString(), originAuthorId);
        assert.equal(story.author.name, 'Ian Fleming');
      });
    });

    context('when we replace author object with story.set({ author })', () => {
      let originAuthorId;
      const newAuthor = { name: 'Sunday', age: 999 };

      beforeEach('Replace author', () => {
        originAuthorId = story.author._id.toString();
        story.set({ author: newAuthor });
      });

      it('should create a new author object in memory', async () => {
        // A new object is created here
        assert.notEqual(story.author._id.toString(), originAuthorId);
        assert.ownInclude(story.author.toObject(), newAuthor);
      });

      context('when story.author.save() is not called', () => {
        it('should not create a new person in database', async () => {
          const actual = await Person.findOne(newAuthor).lean().exec();
          assert.isNull(actual);
        });

        context('when story.save() is called', () => {
          beforeEach('Call story.save()', async () => {
            await story.save();
          });

          it('should not create a new Person', async () => {
            const actual = await Person.findOne(newAuthor).lean().exec();
            assert.isNull(actual);
          });

          it('should update story.author in database', async () => {
            const actual = await Story
              .findOne({ title: 'Casino Royale' })
              .lean()
              .exec();
            assert.notEqual(actual.author.toString(), originAuthorId.toString());
            // Will fail to populate, as object not exists
          });

          context('when story.author.save() is called', () => {
            beforeEach('Call story.save()', async () => {
              await story.author.save();
            });
            it('should not create a new Person', async () => {
              const actual = await Person.findOne(newAuthor).lean().exec();
              assert.ownInclude(actual, newAuthor);
            });
          });
        });
      });

      context('when story.author.save() is called', () => {
        beforeEach('Call story.author.save()', async () => {
          await story.author.save();
        });

        it('should create a new person in database', async () => {
          const actual = await Person.findOne(newAuthor).lean().exec();
          assert.ownInclude(actual, newAuthor);
        });

        it('should not update story author in database', async () => {
          const actual = await Story
            .findOne({ title: 'Casino Royale' })
            .populate('author')
            .lean()
            .exec();
          assert.notOwnInclude(actual, newAuthor);
        });
      });
    });

    context('when we create a new person object and assign to story.author', () => {
      let originAuthorId;
      const newAuthor = { name: 'Sunday', age: 999 };

      beforeEach('Replace Author', async () => {
        originAuthorId = story.author._id.toString();
        story.author = new Person(newAuthor);
      });

      context('when we call story.save()', () => {
        beforeEach('Call story.save()', async () => {
          await story.save();
        });

        it('should update story.author in database', async () => {
          const actual = await Story
            .findOne({ title: 'Casino Royale' })
            .lean()
            .exec();
          assert.notEqual(actual.author.toString(), originAuthorId.toString());
          // Will fail to populate, as object not exists
        });

        context('when story.author.save() is called', () => {
          beforeEach('Call story.save()', async () => {
            await story.author.save();
          });
          it('should not create a new Person', async () => {
            const actual = await Person.findOne(newAuthor).lean().exec();
            assert.ownInclude(actual, newAuthor);
          });
        });
      });
    });
  });
});
