const transactionModel = require("../models/transaction.model.js");
const ledgerModel = require("../models/ledger.model.js");
const transaction = require("../models/transaction.model.js");
const accountModel = require("../models/account.model.js");
const emailService = require("../services/email.service.js");

const { default: mongoose } = require("mongoose");

/**
 * - CREATE a new transaction
 * THE 10-STEPS TO TRANSFER FLOW:
 * 1. Validate request
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create Transaction (PENDING)
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Make transaction COMPLETED
 * 9. Commit MongoDB session
 * 10. Send email notificaiton
 */

async function createTransaction(req, res) {
  /**
   * 1. Validate request
   */
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message:
        "Sender Account , Receicer Account , Amount, Idempotency Key are Required",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
  });

  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({
      message: "Invalid Sender Account or Receiver Account",
    });
  }

  /**
   * 2. Validate idempotency key
   */

  const transacitonExist = await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });

  if (transacitonExist) {
    if (transacitonExist.status == "COMPLETED") {
      return res.status(200).json({
        message: "Transaciton already processed",
        transaction: transacitonExist,
      });
    }
    if (transacitonExist.status == "PENDING") {
      return res.status(200).json({
        message: "Transaction is still processing",
      });
    }
    if (transacitonExist.status == "FAILED") {
      return res.status(500).json({
        message: "Transaction processing failed, please try again",
      });
    }
    if (transacitonExist.status == "REVERSE") {
      return res.status(500).json({
        message: "Transaction was revesed, please try again",
      });
    }
  }

  /**
   * 3. Check account status
   */
  if (
    toUserAccount.status !== "ACTIVE" ||
    fromUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({
      message:
        "Both Sender account and receiver account must be active to process transaction",
    });
  }

  /**
   * 4. Deriver sender balance from ledger
   */
  const balance = await fromUserAccount.getBalance();

  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient balance. Current balance is ${balance}. Required amount is ${amount}`,
    });
  }

  let transaction;
  try {
    /**
     * 5. Create Transaction (PENDING)
     */
    const session = await mongoose.startSession();
    session.startTransaction();

    transaction = (
      await transactionModel.create(
        [
          {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING",
          },
        ],
        { session },
      )
    )[0];

    const debitLedgerEntry = await ledgerModel.create(
      [
        {
          account: new mongoose.Types.ObjectId(fromAccount),
          amount: amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      {
        session,
      },
    );

    await (() => {
      return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
    })();

    const creditLedgerEntry = await ledgerModel.create(
      [
        {
          account:new  mongoose.Types.ObjectId(toAccount),
          amount: amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      {
        session,
      },
    );

    await transactionModel.findOneAndUpdate(
      { _id: transaction._id },
      { status: "COMPLETED" },
      { session },
    );

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    return res.status(400).json({
      message:
        "Transaction is Pending due to some issue, please retry after sometime",
    });
  }

  /**
   * 10. Send email notification
   */

  await emailService.sendTransactionEmail(
    req.user.email,
    req.user.name,
    amount,
    toAccount,
  );

  return res.status(201).json({
    message: "Transaction completed successfully",
    transaction: transaction,
  });
}

async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "Sender Account, Amount and Key is required",
    });
  }

  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!toUserAccount) {
    return (
      res.status(404),
      json({
        message: "Invalid Sender Account",
      })
    );
  }

  const fromUserAccount = await accountModel.findOne({
    user: req.user._id,
  });

  if (!fromUserAccount) {
    return res.status(400).json({
      message: "System user account not found",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = new transactionModel({
    fromAccount: fromUserAccount._id,
    toAccount,
    amount,
    idempotencyKey,
    status: "PENDING",
  });

  await transaction.save({ session });

  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT",
      },
    ],
    { session },
  );

  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT",
      },
    ],

    { session },
  );

  transaction.status = "COMPLETED";
  await transaction.save({ session });

  await session.commitTransaction();
  session.endSession();

  return res.status(200).json({
    message: "Initial funds transaction completed successfully",
    transaction: transaction,
  });
}

module.exports = {
  createTransaction,
  createInitialFundsTransaction,
};
