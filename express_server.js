const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const { getUserByEmail } = require('./helpers');

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['s874bs', '834gfb', 'e9rht1'],
  maxAge: 24 * 60 * 60 * 1000
}));

let urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
    visits: [],
    uniqueVisitors: [],
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
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

const generateRandomString = () => {
  let randomString = (Math.random() + 1).toString(36).substring(2, 8);

  while (urlDatabase[randomString]) {
    randomString = (Math.random() + 1).toString(36).substring(2, 8);
  }

  return randomString;
};

app.get("/", (req, res) => {
  //console.log("Session in / route:", req.session);

  if (!req.session.user_id) {
    //console.log("Redirecting to /login");
    res.redirect("/login");
  } else {
    if (req.path === "/") {
      //console.log("Redirecting to /urls");
      res.redirect("/urls");
    } else {
      res.redirect(req.path);
    }
    
  }
});

const urlsForUser = (id) => {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  //console.log("Session:", req.session);

  if (!users[req.session.user_id]) {
    return res.status(401).send("<h1>Unauthorized</h1><p>Please log in or register to see this page.</p>");
  }

  const userID = req.session.user_id;
  const userURLs = urlsForUser(userID);

  //console.log("Users:", users);
  //console.log("UserID:", userID);

  const templateVars = {
    user: users[userID],
    urls: userURLs
  };

  //console.log("TemplateVars:", templateVars);

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

  if (!userURLs[shortURL]) {
    return res.status(403).send("<h1>Forbidden</h1><p>You do not have permission to access this URL.</p>");
  }

  const templateVars = {
    user: users[userID],
    id: shortURL,
    longURL: userURLs[shortURL].longURL,
    visits: userURLs[shortURL].visits,
    uniqueVisitors: userURLs[shortURL].uniqueVisitors,
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;

  if (longURL) {
    urlDatabase[shortURL].visits.push({
      timestamp: new Date(),
      visitorID: generateRandomString(),
    });
    const visitorID = req.session.visitor_id || generateRandomString();
    if (!urlDatabase[shortURL].uniqueVisitors.includes(visitorID)) {
      urlDatabase[shortURL].uniqueVisitors.push(visitorID);
      req.session.visitor_id = visitorID;
    }
    res.redirect(longURL);
  } else {
    res.status(404).send("<h1>URL Not Found</h1><p>The requested URL does not exist.</p>");
  }
});

app.get("/register", (req, res) => {
  //console.log("Reached GET /register route");
  if (req.session.user_id) {
    //console.log("Redirecting to /urls");
    return res.redirect("/urls");
  }
  
  res.render("register", { user: null });
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }

  res.render("login", { user: null });
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.status(403).send("<h1>Forbidden</h1><p>Please log in or register to shorten URLs.</p>");
  }

  const longURL = req.body.longURL;
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: req.session.user_id,
    visits: [],
    uniqueVisitors: []
  };
  
  console.log(req.body); // Log the POST request body to the console

  res.redirect(`urls/${shortURL}`);
});

app.delete("/urls/:id/delete", (req, res) => {
  const userID = req.session.user_id;
  
  if (!userID) {
    return res.status(401).send("<h1>Unauthorized</h1><p>Please log in to delete this URL.</p>");
  }

  const idToDelete = req.params.id;
  const userURLs = urlsForUser(userID);

  if (!userURLs[idToDelete]) {
    return res.status(403).send("<h1>Forbidden</h1><p>You do not have permission to delete this URL.");
  }

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

  if (!userURLs[idToUpdate]) {
    return res.status(403).send("<h1>Forbidden</h1><p>You do not have permission to edit this URL.</p>");
  }

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

  //console.log("Attempting to log in with email:", userEmail);

  const user = getUserByEmail(userEmail, users);

  if (!user) {
    //console.log("Invalid email or password for email:", userEmail);
    return res.status(403).send("Invalid email or password");
  }

  //console.log("Stored hashed password:", user.password);
  //console.log("Provided password:", userPassword);

  const passwordMatch = bcrypt.compareSync(userPassword, user.password);

  //console.log("bcrypt.compareSync result:", passwordMatch);

  if (!passwordMatch) {
    //console.log("Invalid email or password for email:", userEmail);
    return res.status(403).send("Invalid email or password");
  }

  //console.log("Logged in user ID:", user.id);
  req.session.user_id = user.id;

  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  //console.log("Register route reached");
  const userEmail = req.body.email;
  const userPassword = req.body.password;

  if (!userEmail || !userPassword) {
    //console.log("Email and password cannot be empty");
    return res.status(400).send("Email and password cannot be empty");
  }
  
  const existingUser = getUserByEmail(userEmail, users);
  if (existingUser) {
    //console.log("Email already registered:", userEmail);
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

  //console.log("Registered new user:", newUser);

  req.session.user_id = userID;

  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});