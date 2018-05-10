const mongoose = require('mongoose');
const {
  initPersonModel,
  initStoryModel
} = require('./models.js');
const { main: subdoc } = require('./subdoc.js');

const main = async () => {
  let ret;
  mongoose.set('debug', true);
  mongoose.connect('mongodb://mongo/test');

  const Person = initPersonModel(mongoose);
  const Story = initStoryModel(mongoose);

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


  mongoose.disconnect();
}

main();
