const mongoose = require('mongoose');
const { person, story } = require('./schemas.js');

const initPersonModel = (conn) => {
  return conn.model('Person', person);
}
const initStoryModel = (conn) => {
  return conn.model('Story', story);
}

module.exports = {
  initPersonModel,
  initStoryModel
};
