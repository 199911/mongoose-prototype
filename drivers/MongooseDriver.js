const { Mongoose } = require('mongoose');
const { MongoClient } = require('mongodb');

class MongooseDriver {
  constructor(uri, name) {
    this.config = { uri, name };
  }

  async connectAsync() {
    const { uri, name } = this.config;
    this.mongoose = new Mongoose();
    await this.mongoose.connect(
      uri,
      {
        keepAlive: true,
        dbName: name,
        useNewUrlParser: true,
      },
    );
    return this.mongoose;
  }

  async disconnectAsync() {
    return this.mongoose.disconnect();
  }

  async resetAsync() {
    const { uri, name } = this.config;
    const connection = await MongoClient.connect(uri, { useNewUrlParser: true });
    const db = await connection.db(name);
    await db.dropDatabase();
    await connection.close();
  }
}


module.exports = MongooseDriver;
