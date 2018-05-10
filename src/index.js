const { expect } = require('chai');

const { connect } = require('./driver.js');
const {
  initPersonModel,
  initStoryModel
} = require('./models.js');

describe('populate()', () => {
  let conn;
  let Person, Story;
  beforeEach(async () => {
    conn = connect();
    Person = initPersonModel(conn);
    Story = initStoryModel(conn);

    const author = new Person({
      name: 'Ian Fleming',
      age: 50
    });
    await author.save();

    const story = new Story({
      title: 'Casino Royale',
      // assign the _id from the person
      author: author._id
    });
    await story.save();
  });

  it('should populate person in story.author', async () => {
    const story = await Story
      .findOne({ title: 'Casino Royale' })
      .populate('author')
      .exec();
    expect(story.author.name).to.be.equal('Ian Fleming');
  });

  // Conclusion: don't try to update populated object by set() from host object;
  context('when we update populated object author by story.set({ author: { ... } })', () => {
    it('will create a new populated object', async () => {
      const story = await Story
        .findOne({ title: 'Casino Royale' })
        .populate('author')
        .exec();
      const originAuthorId = story.author._id;
      story.set({ author: {name: 'Sunday'} });
      // A new object is created here
      expect(story.author._id).to.be.not.equal(originAuthorId);
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
        age: 999
      });
      await story.save();
    });

    it('does not save populated object automatically', async () => {
      const myStory = await Story
        .findOne({ title: 'Casino Royale' })
        .exec();
      expect(myStory.author).to.be.not.null;

      const myPopulatedStory = await Story
        .findOne({ title: 'Casino Royale' })
        .populate('author')
        .exec();
      expect(myPopulatedStory.author).to.be.null;
    });
  })

  afterEach(async () => {
    await Person.remove();
    await Story.remove();
    conn.close();
  })

});
