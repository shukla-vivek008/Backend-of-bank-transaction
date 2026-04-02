const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const accountController = require("../controller/account.controller.js");

const router = express.Router();

/**
 * - GET api/account:id
 *
 */
// router.get("/account:id");

/**
 * - POST /api/accounts
 * - CREATE a new account
 * - Protected Route
 */
router.post(
  "/",
  authMiddleware.authMiddleware,
  accountController.createAccountController,
);

/**
 * - GET /api/accounts/
 * - Get all accounts of the logged-id user
 * - Proctected Route
 */
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccoutController);

/**
 * - GET /api/accounts/balance/:accountId
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController)
 
module.exports = router;
