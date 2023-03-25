/** Message class for message.ly */
const db = require("../db");
const ExpressError = require("../expressError");


/** Message on the site. */
class Message {
  constructor(id, from_username, to_username, body, sent_at = null, read_at = null) {
    this.id = id;
    this.from_username = from_username;
    this.to_username = to_username;
    this.body = body;
    this.sent_at = sent_at;
    this.read_at = read_at;
  }

  /** register new message -- returns
   *    {id, from_username, to_username, body, sent_at}
   */
  static async create({from_username, to_username, body}) {
    const result = await db.query(
        `INSERT INTO messages (
              from_username,
              to_username,
              body,
              sent_at)
            VALUES ($1, $2, $3, current_timestamp)
            RETURNING id, from_username, to_username, body, sent_at`,
        [from_username, to_username, body]);
    const r = result.rows[0];
    return new Message(r.id, r.from_username, r.to_username, r.body, r.sent_at);
  }

  /** Update read_at for message */
  async markRead() {
    const result = await db.query(
        `UPDATE messages
           SET read_at = current_timestamp
           WHERE id = $1
           RETURNING id, read_at`,
        [this.id]);

    if (!result.rows[0]) {
      throw new ExpressError(`No such message: ${id}`, 404);
    }

    this.read_at = result.rows[0].read_at; 
    return true;
  }

  /** Get: get message by id
   *
   * returns {id, from_user, to_user, body, sent_at, read_at}
   *
   * both to_user and from_user = {username, first_name, last_name, phone}
   *
   */
  static async get(id) {
    const result = await db.query(
        `SELECT m.id,
                m.from_username,
                f.first_name AS from_first_name,
                f.last_name AS from_last_name,
                f.phone AS from_phone,
                m.to_username,
                t.first_name AS to_first_name,
                t.last_name AS to_last_name,
                t.phone AS to_phone,
                m.body,
                m.sent_at,
                m.read_at
          FROM messages AS m
            JOIN users AS f ON m.from_username = f.username
            JOIN users AS t ON m.to_username = t.username
          WHERE m.id = $1`,
        [id]);
    
    const r = result.rows[0];
    let m = new Message(r.id, r.from_username, r.to_username, r.body, r.sent_at);

    if (!m) {
      throw new ExpressError(`No such message: ${id}`, 404);
    }

    const from_user = {
        username: r.from_username,
        first_name: r.from_first_name,
        last_name: r.from_last_name,
        phone: r.from_phone
      };

    const to_user = {
        username: r.to_username,
        first_name: r.to_first_name,
        last_name: r.to_last_name,
        phone: r.to_phone
    };

    m.from_user = from_user;
    m.to_user = to_user;
    return m;
  }

}


module.exports = Message;