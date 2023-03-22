process.env.NODE_ENV = 'test';

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const Message = require("../models/message");

let u1Token;
let u2Token;
let m1_id;
let m2_id;

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

    m1 = await Message.create({
        from_username: "thebagman",
        to_username: "tbzTheLegend",
        body: "shiny new message from thebagman"
        });

    m1_id = m1.id;

    m2 = await Message.create({
        from_username: "tbzTheLegend",
        to_username: "thebagman",
        body: "shiny new message from tbzTheLegend"
    });

    m2_id = m2.id;
});

describe("POST /messages", function () {
    test("create new message, return result", async function () {
      const response = await request(app)
        .post("/messages").send({
          from_username: "thebagman",
          to_username: "tbzTheLegend",
          body: "hey bestie! ily :)",
          token: u1Token
        });
    
      expect(response.body).toEqual({
        message: 
          {
              id: expect.any(Number),
              from_username: "thebagman",
              to_username: "tbzTheLegend",
              body: "hey bestie! ily :)",
              sent_at: expect.any(String)
          }
      });
    });

    test('create new message, but with no token. expect error', async function() {
        const response = await request(app)
            //no token
            .post('/messages').send({
                from_username: "tbzTheLegend",
                to_username: "the bagman",
                body: "OOPS!"
            });
        expect(response.statusCode).toEqual(401);
        expect(response.body.message).toEqual('Unauthorized');
    });
});

describe('GET /messages/:id', function() {
    test('retrieve and show message by message id', async function() {
        const response = await request(app)
        .get(`/messages/${m1_id}`).send({
            token: u1Token
        });
        expect(response.body).toEqual({
            id: m1_id,
            body: "shiny new message from thebagman",
            sent_at: expect.any(String),
            read_at: null,
            from_user: {
                username: "thebagman",
                first_name: "Bruno",
                last_name: "Gramsci",
                phone: "9999996666"
            },
            to_user: {
                username: "tbzTheLegend",
                first_name: "Tobias",
                last_name: "Zimmer",
                phone: "1234567890"
            }
        });
    });
});

describe('POST /messages/:id/read', function() {
    test("mark a message as 'read'", async function() {
        const response = await request(app)
        .post(`/messages/${m2_id}/read`).send({
            token: u1Token
        });

        expect(response.body).toEqual({
            message: {
              id: m2_id,
              read_at: expect.any(String)
            }
        });

    });

});

afterAll(async function () {
    await db.end();
});

    