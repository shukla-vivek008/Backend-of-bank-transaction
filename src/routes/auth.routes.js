const express = require("express");
const authController = require("../controller/auth.controller.js")


const router = express.Router();

router.post("/register", authController.userRegisterController)

router.post("/login", authController.userLoginController)

module.exports = router;