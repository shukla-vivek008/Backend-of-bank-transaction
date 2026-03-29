const userModel = require("../models/user.model.js");
const jwt = require("jsonwebtoken");

/**
 * - user register controller
 * - POST /api/auth/register
 */

const userRegisterController = async (req, res) => {
  const { email, name, password } = req.body;

  const isExists = await userModel.findOne({
    email: email,
  });

  if (!isExists) {
    return res.status(422).json({
      message: "User already exists with email.",
      status: "failed",
    });
  }

  const newUser = new userModel.create({
    email,
    name,
    password,
  });

  const token = jwt.sign({ userId: user.__id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookies("token", token);

  res.status(201).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });
};

module.exports = userRegisterController;
