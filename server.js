const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const knex = require("knex");
const bcrypt = require("bcrypt");
const saltRounds = 5;
const randomstring = require("randomstring");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const database = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "postgres",
    password: "ed0497",
    database: "csun_task_force",
  },
});

app.post("/user-register", async (req, res) => {
  const { fname, lname, email, password } = req.body;

  const foundUserData = await database("users")
    .select("*")
    .where({ email: email });
  if (foundUserData.length > 0) {
    res.json("user already exists");
  } else {
    const hashedPassword = await bcrypt.hashSync(password, saltRounds);
    const initialRandomString = randomstring.generate();

    database("users")
      .returning("*")
      .insert({
        fname,
        lname,
        email,
        password: hashedPassword,
        email_active: false,
        access_token: initialRandomString,
      })
      .then((data) => {
        if (data.length == 0) {
          res.json("error occured, unable to add the user");
        } else {
          res.json("user added successfully");
        }
      });
  }
});

app.listen(4000, () => {
  console.log("servier is live now");
});
