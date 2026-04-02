const userModel = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const comparePassword = require("../models/user.model.js");
const emailService = require("../services/email.service.js");

/**
 * - User Register controller
 * - POST /api/auth/register
 */
const userRegisterController = async (req, res) => {
  const { email, name, password } = req.body;

  const userExist = await userModel.findOne({ email: email });

  if (userExist) {
    return res.status(422).json({
      message: "User already Exist with this email",
      status: "failed",
    });
  }

  const newUser = await userModel.create({
    email,
    name,
    password,
  });

  const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
  });

  res.status(201).json({
    user: {
      _id: (await newUser)._id,
      email: (await newUser).email,
      password: (await newUser).password,
    },
  });

  await emailService.sendRegistrationEmail(newUser.email, newUser.name)
};

/**
 * - User Login Controller
 * - Post /api/auth/register
 */

const userLoginController = async (req, res) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email }).select("+password");

  if (!user) {
    return res.status(404).json({
      message: "Email not found",
    });
  }

  const isValidPass = await user.comparePassword(password);

  if (!isValidPass) {
    return res.status(401).json({
      message: "Password is Incorrect",
    });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
  });

  res.status(200).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });
};

module.exports = {
  userRegisterController,
  userLoginController,
};
