const ExpressError = require("../expressError");
const db = require("../db");
const { BCRYPT_WORK_FACTOR } = require('../config');
const bcrypt = require('bcrypt');

/** User class for message.ly */
class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register({ username, password, first_name, last_name, phone} ) {
    const hashedPW = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const now = new Date();

    const result = await db.query(`INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at) VALUES
      ($1,$2,$3,$4,$5,$6,$7) RETURNING username, password, first_name, last_name, phone, join_at, last_login_at`,
      [username, hashedPW, first_name, last_name, phone, now, now]);
    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */
  static async authenticate(username, password) { 
    const result = await db.query(`SELECT password FROM users WHERE username=$1`, [username]);
    const user = result.rows[0];

    if (user) {
      let goodPW = await bcrypt.compare(password, user.password);  
      if (!goodPW) {
        return false
      } else {
        const updateTimestamp = await this.updateLoginTimestamp(username);
        if (!updateTimestamp) {
          throw new ExpressError("Unable to update 'last login' value in db", 400);
        }
        return true;
      }
    } else {
      throw new ExpressError("Invalid user/password", 400);
    }
  }

  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) { 
    const result = await db.query(`UPDATE users SET last_login_at=$2 WHERE username=$1 RETURNING last_login_at`, [username, new Date()]);
    return result.rows[0];
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */
  static async all() { 
    const results = await db.query(`SELECT username, first_name, last_name, phone FROM users`);
    return results.rows;
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

    return result.rows[0];
  }
  /** Return messages from this user.
   *
   * [{id, to_username, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */
  static async messagesFrom(username) { 
    const results = await db.query(`SELECT m.id, u.username, u.first_name, u.last_name, u.phone, m.body, m.sent_at, m.read_at
      FROM messages m LEFT JOIN users u ON m.to_username = u.username WHERE m.from_username=$1`, [username]);
      const resultsArray = [];
      for (let x = 0; x < results.rows.length; x++) {
        const { id, username, first_name, last_name, phone, body, sent_at, read_at } = results.rows[x];
        resultsArray.push({id, to_user: {username, first_name, last_name, phone}, body, sent_at, read_at});
      }
    return resultsArray;
  }

  /** Return messages to this user.
   *
   * [{id, from_username, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */
  static async messagesTo(username) { 
    const results = await db.query(`SELECT m.id, u.username, u.first_name, u.last_name, u.phone, m.body, m.sent_at, m.read_at
      FROM messages m LEFT JOIN users u ON m.from_username = u.username WHERE m.to_username=$1`, [username]);
      const resultsArray = [];
      for (let x = 0; x < results.rows.length; x++) {
        const { id, username, first_name, last_name, phone, body, sent_at, read_at } = results.rows[x];
        resultsArray.push({id, from_user: {username, first_name, last_name, phone}, body, sent_at, read_at});
      }
    return resultsArray;
  }
}


module.exports = User;