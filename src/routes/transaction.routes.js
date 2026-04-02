const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const transactionController = require("../controller/transaction.controller.js");

const router = express.Router();
/**
 * - POST /api/transactions
 * - CREATE a transaction
 */
router.post(
  "/",
  authMiddleware.authMiddleware,
  transactionController.createTransaction,
);

/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */
router.post(
  "/system/initial-funds",
  authMiddleware.authMiddleware,
  authMiddleware.authSystemUserMiddleware,
  transactionController.createInitialFundsTransaction,
);

module.exports = router;
