const ExpressError = require("../expressError");
const db = require("../db");
const { BCRYPT_WORK_FACTOR } = require('../config');
const bcrypt = require('bcrypt');
const Message = require('./message');

/** User class for message.ly */
class User {

  constructor(username, password, first_name, last_name, phone, join_at = null, last_login_at = null) {
    this.username = username;
    this.password = password;
    this.first_name = first_name;
    this.last_name = last_name;
    this.phone = phone;
    this.join_at = join_at;
    this.last_login_at = last_login_at;
  }

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register({ username, password, first_name, last_name, phone} ) {
    const hashedPW = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const now = new Date();

    const result = await db.query(`INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at) VALUES
      ($1,$2,$3,$4,$5,$6,$7) RETURNING username, password, first_name, last_name, phone, join_at, last_login_at`,
      [username, hashedPW, first_name, last_name, phone, now, now]);
    const r =  result.rows[0];
    return new User(r.username, r.password, r.first_name, r.last_name, r.phone, r.join_at, r.last_login_at);
  }

  /** Authenticate: is this username/password valid? Returns boolean. */
  static async authenticate(username, password) { 
    const result = await db.query(`SELECT * FROM users WHERE username=$1`, [username]);

    if (result.rows.length > 0) {
      const r = result.rows[0];
      const user = new User(r.username, r.password, r.first_name, r.last_name, r.phone, r.join_at, r.last_login_at);
      let goodPW = await bcrypt.compare(password, user.password);

      if (!goodPW) {
        return false
      } else {
        const updateTimestamp = await user.updateLoginTimestamp();
        if (!updateTimestamp) {
          throw new ExpressError("Unable to update 'last login' value in db", 400);
        }
        return true;
      }
      
    } else {
      throw new ExpressError("Invalid user", 400);
    }
  }

  /** Update last_login_at for user */
  async updateLoginTimestamp() { 
    const result = await db.query(`UPDATE users SET last_login_at=$2 WHERE username=$1 RETURNING last_login_at`, [this.username, new Date()]);
    this.last_login_at = result.rows[0].last_login_at;
    return result.rows[0].last_login_at;
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */
  static async all() { 
    const results = await db.query(`SELECT * FROM users`);

    return results.rows.map(u => new User(u.username, null, u.first_name, u.last_name, u.phone));
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */
  static async get(username) { 
    const result = await db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users
      WHERE username=$1`, [username]);
    const r = result.rows[0];
    return new User(r.username, null, r.first_name, r.last_name, r.phone, r.join_at, r.last_login_at);
  }
  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */
  static async messagesFrom(username) { 
    const results = await db.query(`SELECT m.id, u.username, u.first_name, u.last_name, u.phone, m.body, m.sent_at, m.read_at
      FROM messages m LEFT JOIN users u ON m.to_username = u.username WHERE m.from_username=$1`, [username]);
      const fromMessages = [];
      let r;
      let fromMessage;
      for (let x = 0; x < results.rows.length; x++) {
        r = results.rows[x];
        fromMessage = new Message(r.id, null, null, r.body, r.sent_at, r.read_at);
        fromMessage.to_user = new User(r.username, null, r.first_name, r.last_name, r.phone);
        fromMessages.push(fromMessage);
      }
    return fromMessages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */
  static async messagesTo(username) { 
    const results = await db.query(`SELECT m.id, u.username, u.first_name, u.last_name, u.phone, m.body, m.sent_at, m.read_at
      FROM messages m LEFT JOIN users u ON m.from_username = u.username WHERE m.to_username=$1`, [username]);
      const toMessages = [];
      let r;
      let toMessage;
      for (let x = 0; x < results.rows.length; x++) {
        r = results.rows[x];
        toMessage = new Message(r.id, null, null, r.body, r.sent_at, r.read_at);
        toMessage.from_user = new User(r.username, null, r.first_name, r.last_name, r.phone);
        toMessages.push(toMessage);
      }
    return toMessages;
  }
}


module.exports = User;