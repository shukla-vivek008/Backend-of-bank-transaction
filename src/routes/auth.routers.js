const express = require("express");
const userRegisterController = require("../controller/auth.controller.js")

const router = express.Router();

router.post("/register", userRegisterController)

module.exports = router;