const express = require("express");
const app = express();
const PORT = 8080;  //default port 8080
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['s874bs', '834gfb', 'e9rht1'],
  maxAge: 24 * 60 * 60 * 1000
}));
app.use(methodOverride('_method'));

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

let users = {
  userRandomID: {
    id: "userRandomID",
    email: "a@a.com",
    password: "1234",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "b@b.com",
    password: "5678",
  },
};

//GET Routes

app.get("/", (req, res) => {
  console.log("Session in / route:", req.session);

  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls", (req, res) => {
  if (!users[req.session.user_id]) {
    return res.status(401).send("<h1>Unauthorized</h1><p>Please log in or register to see this page.</p>");
  }

  const userID = req.session.user_id;
  const userURLs = urlsForUser(userID);

  const templateVars = {
    user: users[userID],
    urls: userURLs
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }

  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send("<h1>Unauthorized</h1><p>Please log in or register to see this page.</p>");
  }

  const userID = req.session.user_id;
  const shortURL = req.params.id;
  const userURLs = urlsForUser(userID);

  //Check if user owns URL
  if (!userURLs[shortURL]) {
    return res.status(403).send("<h1>Forbidden</h1><p>You do not have permission to access this URL.</p>");
  }

  const templateVars = {
    user: users[userID],
    id: shortURL,
    longURL: userURLs[shortURL].longURL
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;

  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("<h1>URL Not Found</h1><p>The requested URL does not exist.</p>");
  }
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  
  res.render("register", { user: null });
});

app.get("/login", (req, res) => {
  const templateVars = { user: null };

  if (!req.session.user_id) {
    res.render("login", templateVars);
  } else {
    templateVars.user = users[req.session.user_id];
    return res.redirect("/urls");
  }
});

//POST routes

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.status(403).send("<h1>Forbidden</h1><p>Please log in or register to shorten URLs.</p>");
  }

  const longURL = req.body.longURL;
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: req.session.user_id
  };

  res.redirect(`urls/${shortURL}`);
});

app.delete("/urls/:id/delete", (req, res) => {
  const userID = req.session.user_id;
  
  if (!userID) {
    return res.status(401).send("<h1>Unauthorized</h1><p>Please log in to delete this URL.</p>");
  }

  const idToDelete = req.params.id;
  const userURLs = urlsForUser(userID);

  //Check if user has permission to delete URL
  if (!userURLs[idToDelete]) {
    return res.status(403).send("<h1>Forbidden</h1><p>You do not have permission to delete this URL.");
  }

  //Check if URL exists and delete it
  if (urlDatabase[idToDelete]) {
    delete urlDatabase[idToDelete];
    res.redirect("/urls");
  } else {
    res.status(404).send("<h1>Not Found</h1><p>The requested URL does not exist.</p>");
  }
});

app.put("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  
  if (!userID) {
    return res.status(401).send("<h1>Unauthorized</h1><p>Please log in to edit this URL.</p>");
  }

  const idToUpdate = req.params.id;
  const newLongURL = req.body.newLongURL;
  const userURLs = urlsForUser(userID);

  //Check if user has permission to edit URL
  if (!userURLs[idToUpdate]) {
    return res.status(403).send("<h1>Forbidden</h1><p>You do not have permission to edit this URL.</p>");
  }

  //Check if URL exists and edit it
  if (urlDatabase[idToUpdate]) {
    urlDatabase[idToUpdate].longURL = newLongURL;
    res.redirect("/urls");
  } else {
    res.status(404).send("<h1>Not Found</h1><p>The requested URL does not exist.</p>");
  }
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;

  const user = getUserByEmail(userEmail, users);

  //Check if user is registered in database
  if (!user) {
    return res.status(403).send("Invalid email or password");
  }

  const passwordMatch = bcrypt.compareSync(userPassword, user.password);

  //Check if passwords match
  if (!passwordMatch) {
    return res.status(403).send("Invalid email or password");
  }

  req.session.user_id = user.id;

  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;

  //Check if email and passoword fields have been filled
  if (!userEmail || !userPassword) {
    return res.status(400).send("Email and password cannot be empty");
  }
  
  //Check if user already exists
  const existingUser = getUserByEmail(userEmail, users);
  if (existingUser) {
    return res.status(400).send("Email already registered");
  }

  const userID = generateRandomString();

  const hashedPassword = bcrypt.hashSync(userPassword, 10);

  const newUser = {
    id: userID,
    email: userEmail,
    password: hashedPassword
  };

  users[userID] = newUser;

  req.session.user_id = userID;

  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});