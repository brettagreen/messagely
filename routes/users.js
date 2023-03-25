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
        const users = await User.all();

        if (!users) {
            throw new ExpressError("OOOOOPSSSSSSSIES! no data for you (no soup for you reference)");
        }

        const resultsArray = [];
        let json;

        for (let x = 0; x < users.length; x++) {
            json = {username: users[x].username, first_name: users[x].first_name, last_name: users[x].last_name,
                phone: users[x].phone }
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
        const user = await User.get(req.params.username);

        if (!user) {
            throw new ExpressError("OOOOOPSSSSSSSIES! no data for you (no soup for you reference)");
        }

        const result = {username: user.username, first_name: user.first_name, last_name: user.last_name,
            phone: user.phone, join_at: user.join_at, last_login_at: user.last_login_at}

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
        const toMessages = await User.messagesTo(req.params.username);

        if (toMessages.length === 0) {
            throw new ExpressError("Nothing returned. try again maybe?");
        }

        for (let x = 0; x < toMessages.length; x++) {;

            toMessages[x] = {id: toMessages[x].id, from_user: { username: toMessages[x].from_user.username, first_name: toMessages[x].from_user.first_name,
                last_name: toMessages[x].from_user.last_name, phone: toMessages[x].from_user.phone }, body: toMessages[x].body, sent_at: toMessages[x].sent_at,
                read_at: toMessages[x].read_at};
        }

        return res.json({messages: toMessages});
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
        const fromMessages = await User.messagesFrom(req.params.username);

        if (fromMessages.length === 0) {
            throw new ExpressError("Nothing returned. try again maybe?");
        }

        for (let x = 0; x < fromMessages.length; x++) {;

            fromMessages[x] = {id: fromMessages[x].id, to_user: { username: fromMessages[x].to_user.username, first_name: fromMessages[x].to_user.first_name,
                last_name: fromMessages[x].to_user.last_name, phone: fromMessages[x].to_user.phone }, body: fromMessages[x].body, sent_at: fromMessages[x].sent_at,
                read_at: fromMessages[x].read_at};
        }

        return res.json({messages: fromMessages});
    } catch (err) {
        return next(err);
    }
});

module.exports = router;