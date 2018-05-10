const mongoose = require('mongoose');
const { person, story, parent } = require('./schemas.js');

const initPersonModel = (conn) => {
  return conn.model('Person', person);
}
const initStoryModel = (conn) => {
  return conn.model('Story', story);
}
const initParentModel = (conn) => {
  return conn.model('Parent', parent);
}

module.exports = {
  initPersonModel,
  initStoryModel,
  initParentModel
};
