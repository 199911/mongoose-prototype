const { Schema } = require('mongoose');

const person = new Schema({
  name: String,
  age: Number,
  stories: [{ type: Schema.Types.ObjectId, ref: 'Story' }]
});

const story = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'Person' },
  title: String,
  fans: [{ type: Schema.Types.ObjectId, ref: 'Person' }]
});

const child = new Schema({
  name: 'string'
});

const parent = new Schema({
  name: String,
  // Array of subdocuments
  children: [child],
  // Single nested subdocuments. Caveat: single nested subdocs only work
  // in mongoose >= 4.2.0
  child: child
});


module.exports = {
  person,
  story,
  child,
  parent
};
