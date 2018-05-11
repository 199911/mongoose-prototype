const { expect } = require('chai');

const { connect } = require('./driver.js');
const {
  initParentModel
} = require('./models.js');

describe('sub-documents', () => {
  let conn;
  let Parent;
  let parent;
  let originalChildId;
  beforeEach(async () => {
    conn = connect();
    Parent = initParentModel(conn);

    parent = new Parent({
      name: 'Mum',
      children: [{ name: 'Matt' }, { name: 'Sarah' }],
      child: { name: 'Matt'}
    });
    await parent.save();
    originalChildId = parent.child._id.toString();
  });

  // We can access sub document with path1.path2
  it('should update child with parent.set("child.name", value)', async () => {
    parent.set('child.name', 'Sunday');
    await parent.save();

    const myParent = await Parent
      .findOne({ name: 'Mum' })
      .exec();

    // No new child is created
    expect(myParent.child._id.toString()).to.be.equal(originalChildId);
    expect(myParent.child.name).to.be.equal('Sunday');
  });

  afterEach(async () => {
    await Parent.remove();
    conn.close();
  })
});
