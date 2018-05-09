const mongoose = require('mongoose');

mongoose.set('debug', true);
mongoose.connect('mongodb://mongo/test');
require('./subdoc.js')
