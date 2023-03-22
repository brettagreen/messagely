const express = require("express");
const router = new express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = ('../config');
const ExpressError = require('../expressError');


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", async function (req, res, next) {
    try {
      const vars = req.body;

      const result = await User.register(vars);

      if (!result) {
        throw new ExpressError("Registration failed!!!!!! Try again!!!", 400);
      }
      let token = jwt.sign({username: req.body.username}, "garbageButSaidInFrench");
  
      return res.status(201).json({token});
    } catch (err) {
      return next(err);
    }
  });

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async function (req, res, next) {
    try {
        const { username, password } = req.body;
    
        const goodlogin = await User.authenticate(username, password);

        if (!goodlogin) {
            throw new ExpressError("Unable to authenticate", 400);
        }

        let token = jwt.sign({username: username}, "garbageButSaidInFrench");

        return res.json({token});
    } catch (err) {
        return next(err);
    }
});

module.exports = router;