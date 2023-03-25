const express = require("express");
const router = new express.Router();
const Message = require('../models/message');
const ExpressError = require('../expressError');
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async function (req, res, next) {
    const message = await Message.get(req.params.id);

    if (!message) {
        throw new ExpressError("No message found with that id", 402);
    }

    const { id, body, sent_at, read_at, from_user, to_user } = message;

    if (message.from_username !== req.user.username && message.to_username !== req.user.username) {
        return next({ status: 401, message: "Unauthorized" });
    }

    return res.json({id, body, sent_at, read_at, from_user: from_user, to_user: to_user});
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async function (req, res, next) {
    const message = await Message.create(req.body);

    if (!message) {
        throw new ExpressError("unable to create new message", 400);
    }

    return res.status(201).json({message: {id: message.id, from_username: message.from_username, to_username: message.to_username,
        body: message.body, sent_at: message.sent_at}});
 });

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', async function (req, res, next) {
    const message = await Message.get(req.params.id);

    if (message.to_username === req.user.username) {
        await message.markRead();
        if (!message.read_at) {
            throw new ExpressError("unable to update 'read_at'", 400);
        }
        return res.json({message: {id: message.id, read_at: message.read_at}});
    } else {
        throw new ExpressError("unauthorized", 401);
    }
});

module.exports = router;