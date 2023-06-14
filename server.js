const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const knex = require("knex");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  let x = {
    name: "ed",
    age: 22,
  };
  res.json(x);
});

app.listen(3000, () => {
  console.log("servier is live now");
});
