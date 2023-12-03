const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    
    assert.propertyVal(user, 'id', expectedUserID, `User should have id ${expectedUserID}`);
  });

  it('should return undefined if the specified email is not in the database', () => {
    const user = getUserByEmail("a@a.com", testUsers);
    
    assert.isUndefined(user, 'The user should be undefined');
  });

  it('should return undefined if email is empty', () => {
    const user = getUserByEmail('', testUsers);

    assert.isUndefined(user, 'The user should be undefined');
  });
});