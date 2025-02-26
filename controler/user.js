const User = require("../models/user.js");

module.exports.signUp = async (req, res) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ email, username });
    let registerUser = await User.register(newUser, password);

    //This is used automatic login for user after signup.
    req.login(registerUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to Try It On");
      res.redirect("/listings");
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect(res.locals.redirectUrl);
  }
};

module.exports.loginPage = async (req, res) => {
  res.render("users/login.ejs");
};

module.exports.loginPost = async (req, res) => {
  req.flash("success", "Logged in Successfully");

  //this is for again redirecting to listings after logout the user.
  let redirectUrl = res.locals.redirectUrl || "/listings";

  res.redirect(redirectUrl);
};

module.exports.logout = async (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "Logged out");
    res.redirect("/login");
  });
};
