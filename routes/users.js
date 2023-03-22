const express = require("express");
const router = new express.Router();
const User = require('../models/user');
const ExpressError = require('../expressError');
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get('/', ensureLoggedIn, async function (req, res, next) {
    try {

        const results = await User.all();

        if (results.length === 0) {
            throw new ExpressError("OOOOOPSSSSSSSIES! no data for you (no soup for you reference)");
        }

        const resultsArray = [];
        let json;

        for (let x = 0; x < results.length; x++) {
            json = {username: results[x].username, first_name: results[x].first_name, last_name: results[x].last_name,
                phone: results[x].phone }
            resultsArray.push(json);
        }
        return res.json({users: resultsArray});
    } catch (err) {
        return next(err);
    }
});


/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get('/:username', ensureCorrectUser, async function (req, res, next) {
    try {
        const result = await User.get(req.params.username);

        if (result.length === 0) {
            throw new ExpressError("OOOOOPSSSSSSSIES! no data for you (no soup for you reference)");
        }

        return res.json({user: result});
    } catch (err) {
        return next(err);
    }
});


/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/to', ensureCorrectUser, async function (req, res, next) {
    try {
        const results = await User.messagesTo(req.params.username);

        if (results.length === 0) {
            throw new ExpressError("Nothing returned. try again maybe?");
        }
        return res.json({results});
    } catch (err) {
        return next(err);
    }
});

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/from', ensureCorrectUser, async function (req, res, next) {

    try {
        const results = await User.messagesFrom(req.params.username);

        if (results.length === 0) {
            throw new ExpressError("Nothing returned. try again maybe?");
        }
        return res.json({results});
    } catch (err) {
        return next(err);
    }
});

module.exports = router;