require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");

// const MONGO_URL = "mongodb://127.0.0.1:27017/greatpark";
const dbUrl = process.env.ATLASDB_URL;

const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

//express-router
const listingRouter = require("./routes/listings.js");
const reviewRouter = require("./routes/reviews.js");
const userRouter = require("./routes/authenticate.js");

const expressError = require("./utils/expressError.js");

const session = require("express-session");
const MongoStore = require("connect-mongo");

const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");

app.use(express.static(path.join(__dirname, 'public')));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET_CODE,
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("error in Mongo Session", err);
});

const sessionOption = {
  store,
  secret: process.env.SECRET_CODE,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.successMsg = req.flash("success");
  res.locals.delMsg = req.flash("delete");
  res.locals.revSuccess = req.flash("revSuccess");
  res.locals.revDel = req.flash("revDel");
  res.locals.errMsg = req.flash("error");
  res.locals.curUser = req.user;
  next();
});

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl, {
    serverSelectionTimeoutMS: 20000, // 20 seconds
  });
}

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/trial", (req, res) => {
  res.render("trial.ejs");
});

app.get("/about", (req, res) => {
  res.render("about.ejs");
});
//Error handler middleware

app.all("*", (req, res, next) => {
  next(new expressError(404, "Page not Found!!"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went Wrong!!" } = err;
  res.status(statusCode).render("error.ejs", { message, err });
  res.status(statusCode).send(message);
});

app.listen(8000, () => {
  console.log("App is Listening to Port 8000");
});
