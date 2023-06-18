const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const knex = require("knex");
const bcrypt = require("bcrypt");
require("dotenv").config();
const nodemailer = require("nodemailer");
const saltRounds = 5;
const randomstring = require("randomstring");
const _EMAIL = process.env.EMAIL;
const _PASSWORD = process.env.PASSWORD;

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
  return {
    from: _EMAIL,
    to: sendTo,
    subject: subject,
    text: text,
  };
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

const authUser = async (req, res, next) => {
  const { user_id, access_token } = req.body;

  await database("users")
    .select("*")
    .where({
      id: user_id,
      access_token: access_token,
    })
    .then((data) => {
      if (data.length != 0) {
        next();
      } else {
        res.json("Unauthorized User");
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
  const { email, password } = req.body;

  database("users")
    .select("*")
    .where({ email })
    .then((data) => {
      if (data.length < 1) {
        res.json("User does not exist");
      } else if (!bcrypt.compare(password, data[0].password)) {
        res.json("Wrong password");
      } else if (!data[0].email_active) {
        res.json("The email has not been verified yet");
      } else {
        const randomString = randomstring.generate();
        database("users")
          .returning("*")
          .update({
            access_token: randomString,
          })
          .then((data) => {
            res.json({
              user_id: data[0].id,
              access_token: data[0].access_token,
            });
          });
      }
    });
});

app.post("/add-user-category", authUser, (req, res) => {
  const { user_id, category } = req.body;

  database("categories")
    .returning("*")
    .insert({
      user_id,
      category,
    })
    .then((data) => {
      res.json({
        addedCategory: data[0],
      });
    });
});

app.post("/add-user-task", authUser, (req, res) => {
  const { user_id, title, description, date, category } = req.body;

  let dateSet = date;
  if (!date) dateSet = null;

  database("tasks")
    .returning("*")
    .insert({
      user_id,
      title,
      description,
      date: dateSet,
      category,
      completed: false,
    })
    .then((data) => {
      res.json({
        addedTask: data[0],
      });
    });
});

app.listen(4000, () => {
  console.log("servier is live now");
});
