# Ledger Backend - Bank Transaction System

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen.svg)
![Express](https://img.shields.io/badge/express-5.2.1-lightgrey.svg)

A robust, secure financial ledger system built with Node.js and MongoDB. This backend manages user accounts, handles double-entry style transactions, and ensures data integrity through idempotency and ledger-based balance calculations.

## 📖 Overview

The **Ledger Backend** is designed to provide a reliable foundation for banking operations. Unlike simple CRUD applications, this system utilizes a ledger-based approach where account balances are dynamically calculated from transaction history (Debits/Credits), ensuring a high degree of financial accuracy and auditability.

### Key Value Propositions
- **Financial Integrity**: Balances are derived from ledger entries using MongoDB aggregation, preventing "drift" common in static balance fields.
- **Idempotency**: Built-in support for idempotency keys to prevent duplicate transactions during network retries.
- **Security First**: JWT-based authentication with cookie-based storage and secure password hashing.
- **System Controls**: Specialized endpoints for system-level initial funding and account state management (Active, Frozen, Closed).

---

## 🚀 Features

- **User Management**: Secure registration and login with `bcryptjs` hashing.
- **Account Management**: Support for multiple accounts per user with status controls (ACTIVE, FROZEN, CLOSED).
- **Transaction Engine**: 
    - Peer-to-peer transfers.
    - System-to-user initial funding.
    - Transaction status tracking (PENDING, COMPLETED, FAILED, REVERSE).
- **Ledger System**: Automated debit/credit entry creation for every transaction.
- **Real-time Balance**: Aggregated balance calculation using high-performance MongoDB pipelines.
- **Email Service**: Integrated `nodemailer` for transaction notifications and alerts.

---

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js (v5.2.1)
- **Database**: MongoDB (via Mongoose v9.3.1)
- **Authentication**: JSON Web Tokens (JWT) & Cookie-parser
- **Security**: Bcryptjs
- **Communication**: Nodemailer

---

## 🏗 Architecture

The project follows a modular architecture separating concerns into controllers, services, and models.

### Directory Structure
```text
├── src/
│   ├── config/      # Database and environment configurations
│   ├── controller/  # Request handling and orchestration
│   ├── middleware/  # Auth and validation logic
│   ├── models/      # Mongoose schemas (User, Account, Transaction, Ledger)
│   ├── routes/      # API endpoint definitions
│   ├── services/    # External integrations (Email)
│   └── app.js       # Express application setup
└── server.js        # Entry point and DB connection
```

### Data Flow: Transaction Processing
1. **Request**: User initiates a transfer via `/api/transactions`.
2. **Validation**: Auth middleware verifies the JWT; Controller checks for sufficient funds and account status.
3. **Execution**: A transaction record is created with an `idempotencyKey`.
4. **Ledger Entry**: Two entries are created in the Ledger (Debit from sender, Credit to receiver).
5. **Aggregation**: The `getBalance()` method on the Account model recalculates the balance for future validations.

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18.x or higher)
- MongoDB (Local instance or Atlas URI)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shukla-vivek008/Backend-of-bank-transaction.git
   cd Backend-of-bank-transaction
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/ledger_db
   JWT_SECRET=your_super_secret_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. **Run the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

---

## 📑 API Documentation

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT in cookie |
| POST | `/api/auth/logout` | Clear session and blacklist token |

### Accounts
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/accounts` | Create a new bank account |
| GET | `/api/accounts` | List all accounts for logged-in user |
| GET | `/api/accounts/balance/:accountId` | Get aggregated balance for specific account |

### Transactions
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/transactions` | Transfer funds between accounts |
| POST | `/api/transactions/system/initial-funds` | (Admin Only) Inject initial funds |

---

## 💻 Usage Example

### Calculating Balance (Internal Logic)
The system uses the following aggregation logic to ensure balance accuracy:

```javascript
const balanceData = await ledgerModel.aggregate([
  { $match: { account: accountId } },
  {
    $group: {
      _id: null,
      totalDebit: { $sum: { $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0] } },
      totalCredit: { $sum: { $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0] } },
    },
  },
  {
    $project: {
      balance: { $subtract: ["$totalCredit", "$totalDebit"] },
    },
  },
]);
```

---

## 🛠 Development

### Running Tests
```bash
npm test
```

### Code Style
- Follows CommonJS module patterns.
- Uses Mongoose middleware for password hashing and transaction hooks.
- Strict schema validation for financial amounts (no negative transactions).

---

## 🔒 Security Considerations
- **Idempotency**: Prevents duplicate charges if the client retries a request.
- **JWT Blacklisting**: Ensures logged-out tokens cannot be reused.
- **Immutable Fields**: Critical fields like `systemUser` status cannot be changed after creation.
- **Schema Validation**: Email regex and password length constraints are enforced at the database level.

---

## 📄 License
This project is licensed under the **ISC License**.

---

## 👥 Contributors
- **Vivek Shukla** - *Initial Work* - [shukla-vivek008](https://github.com/shukla-vivek008)

---
*Note: This is a backend service. For a complete banking experience, a frontend consumer or API client like Postman is required.*