const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const knex = require("knex");
const bcrypt = require("bcrypt");
require("dotenv").config();
const nodemailer = require("nodemailer");
//
const _EMAIL = process.env.EMAIL;
const _PASSWORD = process.env.PASSWORD;
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

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: _EMAIL,
    pass: _PASSWORD,
  },
});

const mailOptions = (sendTo, subject, text) => {
  var obj = {
    from: _EMAIL,
    to: sendTo,
    subject: subject,
    text: text,
  };
  return obj;
};

const sendEmail = (itemToMail) => {
  transporter.sendMail(itemToMail, (error, info) => {
    if (error) {
      console.log("Sending Email error");
    } else {
      console.log(info.response);
    }
  });
};

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
      .then(async (data) => {
        if (data.length == 0) {
          res.json("error occured, unable to add the user");
        } else {
          let constructedLink = `http://localhost:4000/user-verify-email?user_id=${data[0].id}&fname=${data[0].fname}&lname=${data[0].lname}&access_token=${data[0].access_token}`;
          let objectThatHasMailOptions = mailOptions(
            email,
            "Email Verification",
            `Please click the link to verify: ${constructedLink}`
          );
          await sendEmail(objectThatHasMailOptions);
          res.json("user added successfully");
        }
      });
  }
});

app.get("/user-verify-email", (req, res) => {
  const { user_id, fname, lname, access_token } = req.query;

  database("users")
    .select("*")
    .where({
      id: user_id,
      fname,
      lname,
      access_token,
    })
    .then(async (data) => {
      if (data.length != 1) {
        res.json("Unable to find the user");
      } else if (data[0].email_active) {
        res.json("Email is already active");
      } else {
        database("users")
          .returning("*")
          .update({ email_active: true })
          .where({
            id: user_id,
            fname,
            lname,
            access_token,
          })
          .then(() => res.json("Email has been activated"));
      }
    });
});

app.post("/user-login", (req, res) => {
  // not done yet
});

app.listen(4000, () => {
  console.log("servier is live now");
});
