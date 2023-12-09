let urlDatabase = {
  "b2xVn2": {
    longURL: "http:www.lighthouselabs.ca",
    userID: "userRandomID",
    visits: [],
    uniqueVisitors: [],
  },
  "9sm5xK": {
    longURL: "http:www.google.com",
    userID: "userRandomID",
    visits: [],
    uniqueVisitors:[],
  }
};

const getUserByEmail = (email, users) => {
  return Object.values(users).find(user => user.email === email);
};

const generateRandomString = () => {
  let randomString = (Math.random() + 1).toString(36).substring(2, 8);

  while (urlDatabase[randomString]) {
    randomString = (Math.random() + 1).toString(36).substring(2, 8);
  }

  return randomString;
};

const urlsForUser = (id) => {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};


module.exports = { getUserByEmail, generateRandomString, urlsForUser };