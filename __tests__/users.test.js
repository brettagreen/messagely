process.env.NODE_ENV = 'test';

const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");

let u;
let u1;
let u2;
let m1;
let m2;

beforeAll(async function () {
  await db.query("DELETE FROM messages");
  await db.query("DELETE FROM users");
  await db.query("ALTER SEQUENCE messages_id_seq RESTART WITH 1");

  u = await User.register({
    username: "test",
    password: "password",
    first_name: "Test",
    last_name: "Testy",
    phone: "+14155550000"
  });

  u1 = await User.register({
    username: "test1",
    password: "password",
    first_name: "Test1",
    last_name: "Testy1",
    phone: "+14155550000"
  });

  u2 = await User.register({
    username: "test2",
    password: "password",
    first_name: "Test2",
    last_name: "Testy2",
    phone: "+14155552222"
  });

  m1 = await Message.create({
    from_username: "test1",
    to_username: "test2",
    body: "u1-to-u2"
  });

  m2 = await Message.create({
    from_username: "test2",
    to_username: "test1",
    body: "u2-to-u1"
  });

});

describe("Test User class", function () {

  test("can register", async function () {
    //user already created - ostensibly! - in beforeAll()
    expect(u1.username).toBe("test1");
    expect(u1.password).not.toBe(undefined);
    expect(u2.username).toBe('test2');
    expect(u2.phone).toEqual("+14155552222");
  });

  test("can authenticate", async function () {
    let isValid = await User.authenticate("test", "password");
    expect(isValid).toBeTruthy();

    isValid =  await User.authenticate("test", "xxx");
    expect(isValid).toBeFalsy();
  });

  test("can update login timestamp", async function () {
    await db.query("UPDATE users SET last_login_at=NULL WHERE username='test'");
    u = await User.get('test');
    expect(u.last_login_at).toBeNull()

    await u.updateLoginTimestamp();

    expect(u.last_login_at).not.toBeNull();
  });

  test("can get", async function () {
    let x = await User.get("test");
    expect(x).toBeInstanceOf(User);
    expect(x).toHaveProperty('phone', "+14155550000");
    expect(x).toHaveProperty('join_at', expect.any(Date));
    //i.e. not null. excuse to use expect.anything() :p
    expect(x).toHaveProperty('last_login_at', expect.anything());

  });

  test("can get all", async function () {
    let a = await User.all();
    expect(a.length).toEqual(3);
    expect(a).toEqual([{"first_name": "Test1", "join_at": null, "last_login_at": null, "last_name": "Testy1", "password": null,
     "phone": "+14155550000", "username": "test1"}, {"first_name": "Test2", "join_at": null, "last_login_at": null,
      "last_name": "Testy2", "password": null, "phone": "+14155552222", "username": "test2"},
       {"first_name": "Test", "join_at": null, "last_login_at": null, "last_name": "Testy", "password": null,
        "phone": "+14155550000", "username": "test"}]);
  });
});

describe("Test messages part of User class", function () {

  test('can get messages from user', async function () {
    let m = await User.messagesFrom("test1");
    expect(m).toEqual([{
      id: expect.any(Number),
      from_username: null,
      to_username: null,
      body: "u1-to-u2",
      sent_at: expect.any(Date),
      read_at: null,
      to_user: {
        username: "test2",
        password: null,
        first_name: "Test2",
        last_name: "Testy2",
        phone: "+14155552222",
        join_at: null,
        last_login_at: null
      }
    }]);
  });

  test('can get messages to user', async function () {
    let m = await User.messagesTo("test1");
    expect(m).toEqual([{
      id: expect.any(Number),
      from_username: null,
      to_username: null,
      body: "u2-to-u1",
      sent_at: expect.any(Date),
      read_at: null,
      from_user: {
        username: "test2",
        password: null,
        first_name: "Test2",
        last_name: "Testy2",
        phone: "+14155552222",
        join_at: null,
        last_login_at: null
      }
    }]);
  });
});

afterAll(async function() {
  await db.end();
});
