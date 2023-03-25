process.env.NODE_ENV = 'test';

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const Message = require("../models/message");

let u1Token;
let u2Token;

beforeAll(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let response = await request(app).post("/auth/register")
    .send({
        username: "thebagman",
        password: "testingISFUN",
        first_name: "Bruno",
        last_name: "Gramsci",
        phone: "9999996666"
    });

    u1Token = response.body.token;

    response = await request(app).post('/auth/register')
    .send({
        username: "tbzTheLegend",
        password: "frenchFries",
        first_name: "Tobias",
        last_name: "Zimmer",
        phone: "1234567890"
    });

    u2Token = response.body.token

    await Message.create({
        from_username: "thebagman",
        to_username: "tbzTheLegend",
        body: "shiny new message from thebagman"
        });

    await Message.create({
        from_username: "tbzTheLegend",
        to_username: "thebagman",
        body: "shiny new message from tbzTheLegend"
    });
});

describe("GET /users", function () {
    test("get a list of all site users", async function () {
      const response = await request(app)
        .get("/users").send({
          token: u1Token
        });
    
      expect(response.body).toEqual({
        users: [
          {
              username: "thebagman",
              first_name: "Bruno",
              last_name: "Gramsci",
              phone: "9999996666"
          },{
              username: "tbzTheLegend",
              first_name: "Tobias",
              last_name: "Zimmer",
              phone: "1234567890"
          }
      ]});

    });

    test('unauthorized response', async function() {
      const response = await request(app).
        get('/users').send({
          token: "abcdefghijklmnop"
        });
        //401 unauthorized
        expect(response.statusCode).toEqual(401);
    });

});

describe('GET /users/:username', function () {
    test('return user details by passing username', async function() {
      const response = await request(app)
        .get("/users/tbzTheLegend").send({
          token: u2Token
        });

      expect(response.body).toEqual({
        user: {
          username: "tbzTheLegend",
          first_name: "Tobias",
          last_name: "Zimmer",
          phone: "1234567890",
          join_at: expect.any(String),
          last_login_at: expect.any(String)
        }
      });

    });

    test('reject when user token bearer does not match user in params', async function() {
      const response = await request(app)
        .get("/users/thebagman").send({
          token: u2Token
        });
      
      //return unauthorized
      expect(response.statusCode).toEqual(401);
      expect(response.body.message).toEqual("Unauthorized");
    });

});

describe('GET /users/:username/to', function() {
    test('return message(s) user has received', async function() {
      const response = await request(app)
      .get("/users/tbzTheLegend/to").send({
        token: u2Token
      });

      expect(response.body).toEqual({messages:[{
        id: expect.any(Number),
        from_user: {
          username: "thebagman",
          first_name: "Bruno",
          last_name: "Gramsci",
          phone: "9999996666"
        },
        body: "shiny new message from thebagman",
        sent_at: expect.any(String),
        read_at: null
      }]});
    });

    test('reject when user token bearer does not match user in params', async function() {
      const response = await request(app)
      .get("/users/tbzTheLegend/to").send({
        token: u1Token
      });
      //return unauthorized
      expect(response.statusCode).toEqual(401);
      expect(response.body.message).toEqual("Unauthorized");
    });
});

describe('GET /users/:username/from', function() {
    test('return message(s) user has sent', async function() {
      const response = await request(app)
      .get("/users/tbzTheLegend/from").send({
        token: u2Token
      });

      expect(response.body).toEqual({messages:[{
        id: expect.any(Number),
        to_user: {
          username: "thebagman",
          first_name: "Bruno",
          last_name: "Gramsci",
          phone: "9999996666"
        },
        body: "shiny new message from tbzTheLegend",
        sent_at: expect.any(String),
        read_at: null
      }]});
    });

    test('reject when user token bearer does not match user in params', async function() {
      const response = await request(app)
      .get("/users/tbzTheLegend/from").send({
        token: u1Token
      });
      //return unauthorized
      expect(response.statusCode).toEqual(401);
      expect(response.body.message).toEqual("Unauthorized");
    });

});

  
afterAll(async function () {
  await db.end();
});
