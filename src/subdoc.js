const { expect } = require('chai');

const { connect } = require('./drivers/mongoose.js');
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
      children: [
        {
          name: 'Matt' ,
          age: 22
        },
        {
          name: 'Sarah',
          age: 18
        }
      ],
      child: {
        name: 'Matt',
        age: 22
      }
    });
    await parent.save();
    originalChildId = parent.child._id.toString();
  });

  // We can update sub document with path1.path2
  it('should update child with parent.set("child.name", value)', async () => {
    parent.set('child.name', 'Sunday');
    await parent.save();

    const myParent = await Parent
      .findOne({ name: 'Mum' })
      .exec();

    // No new child is created
    expect(myParent.child._id.toString()).to.be.equal(originalChildId);
    expect(myParent.child.name).to.be.equal('Sunday');
    expect(myParent.child.age).to.be.equal(22);
  });

  // We can update sub document with path1.path2, but the other field in child got removed
  it('should update child with parent.set({ child: {name: value} })', async () => {
    parent.set({ child: {name: 'Sunday'} });
    await parent.save();

    const myParent = await Parent
      .findOne({ name: 'Mum' })
      .exec();

    // New sub-document will be created, as we set an object to sub-document
    expect(myParent.child._id.toString()).to.be.not.equal(originalChildId);
    expect(myParent.child.name).to.be.equal('Sunday');
    expect(myParent.child.age).to.be.undefined;
  });

  // We have to call parent.save() to update sub-document
  it('will not update parent.child if call child.save()', async () => {
    const child = parent.child;
    child.set({name: 'Sunday'});
    await child.save();

    const myParent = await Parent
      .findOne({ name: 'Mum' })
      .exec();

    expect(myParent.child._id.toString()).to.be.equal(originalChildId);
    expect(myParent.child.name).to.be.equal('Matt');
  });

  // child.set will mark the field dirty, so parent.ave() will update the record
  it('will update parent.child if call child.set() and parent.save()', async () => {
    const child = parent.child;
    child.set({name: 'Sunday'});
    await parent.save();

    const myParent = await Parent
      .findOne({ name: 'Mum' })
      .exec();

    expect(myParent.child._id.toString()).to.be.equal(originalChildId);
    expect(myParent.child.name).to.be.equal('Sunday');
    expect(myParent.child.age).to.be.equal(22);
  });

  // We can update sub document in array with path1.index
  it('should update child with parent.set("children.1.name", value)', async () => {
    parent.set('children.1.name', 'Sunday');
    await parent.save();

    const myParent = await Parent
      .findOne({ name: 'Mum' })
      .exec();

    expect(myParent.children[1].name).to.be.equal('Sunday');
    expect(myParent.children[1].age).to.be.equal(18);
  });

  afterEach(async () => {
    await Parent.remove();
    conn.close();
  })
});
