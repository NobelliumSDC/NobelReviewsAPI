// This module adds environment variables to
// process.env, based on values in ../.env.
// See that file for configurable values.
require("dotenv").config();

const express = require("express");
const path = require("path");
const controllers = require("./controllers.js");
const logger = require("./middleware/logger.js");
const authChecker = require("./middleware/authChecker.js");

const app = express();

// TODO: Set up static service of assets
app.use(express.static(path.join(__dirname, "../client/dist")));
app.use(express.json());


const PORT = process.env.PORT || 3000;

app.listen(PORT);
console.log(`Server listening at http://localhost:${PORT}`);
