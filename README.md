#  Assessment ID: FS-02 
# PayFlow - Merchant Payment Link

PayFlow is a full-stack payment link management platform featuring a React (Vite) merchant dashboard, a Node.js/Express (TypeScript) REST API, and a MongoDB Atlas database. It supports instant payment link creation, simulated customer checkout flows, secured webhook callbacks, and bcrypt-hashed JWT authentication.

---
## DEmo Video 

https://github.com/user-attachments/assets/c6a10016-c822-4c13-a86d-cecd760ab78a


## Assumptions made 

- Every Merchant will be unique (unique constraint on Email)
- a merchant can create many payment links and can access only their created links (Authorization)
(one merchant ->  many payment links )
- any customer can use those links to make payment (public APIS)
- a payment link will have many payment intent (attempts)
(one payment link -> many payment attempts)
- Payment link will have status as ACTIVE -> PAID | EXPIRED
- A payment intent will have status PENDING -> SUCCESS | FAILED
- an EXPIRED or PAID link can't be processed  for any further payment intent.
- For a single Payment Link 
  - A payment intent is created with default PENDING status, 
  - If it's status is PENDING then a new payment intent can't be created again. 
  - If it's status is SUCCESS then Link is marked as PAID and a new payment intent can't be created again for that particular link.
  - If it's status is FAILED then a new payment intent can be created again.
- Link expiration time is 2 days.
- JWT Token expiration is 7 days.
- SUCCESS is final state of payment intent.




## Questions 1. 
1. The provider sends FAILED after SUCCESS for the same payment. What does your system do, and why?

  The payment status from the provider through the webhook mostly are in order:

    - Pending
    - Failed 
    - Success

  Most probable scenario:- 

  - unless the payment  transaction is completed the provider will not send  Success, if we are getting  FAILED after SUCCESS it seems like a out of order events problem (due to network latency, failed arrived after success). so Once we received Success we will mark as a final stage of payment and will not change payment status.

  No service is fault proof so, 

  - we can compare timestamps, sequence number of Failed payload against SUCCESS payload, 
if  SUCCESS event was logged earlier and failed event arrived later then we can consider SUCCESS event as source of truth.

  - we can query the payment provider to get real time status of our particular payment, 

  -  a cron job will cross- check every payment happened  throughtout the day and create a settlement file, if any conflits arouse then enginner can be notified through slack/email etc.  




# Question 2.
 How would you make sure a link is never paid twice if two customers press "Pay" at the same moment?

two users are clicking the same link so Idempotency will NOT work here. because both users  will have their  unique idempotent key, its RACE Condition problem 

To prevent a race condition if two customers click "Pay" simultaneously, I would use MongoDB's atomic findOneAndUpdate operation rather than a sequential "read-then-write" approach. 
the database inherently acts as a lock.
 The first request instantly changes the state, causing the exact simultaneous second request to fail the query condition, safely blocking the duplicate attempt. 




# Webhook implementation
  webhook link can be initiated providing shared secret in header
  - ### with  curl 
  ```
  curl -X POST http://localhost:3000/webhooks/provider \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: payflow_secret_key_123" \
  -d '{
    "eventId": "evt_001",
    "paymentId": "pay_123",
    "status": "SUCCESS"
  }'
  ```

  - ### Postman 
  
![Postman ](screenshots/postman_header.png)
![Postman ](screenshots/postman_body.png)
## 🏗️ System Architecture & How It Works

The platform uses a decoupled client-server architecture:

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│        Frontend Process         │           │         Backend Process         │
│   (Vite Dev Server on Port 3000)│           │  (Express/Node.js on Port 5000) │
└────────────────┬────────────────┘           └────────────────┬────────────────┘
                 │ Serves HTML/JS/CSS                          │ Listens at /v1/*
                 ▼                                             ▼
        [ User's Browser ] ─────── HTTP / Fetch API ───────────┘
      Executes React Components             │
      (Merchant UI & Pay Pages)             │ Connects to Mongoose
                                            ▼
                                  [ MongoDB Atlas Cloud ]
                                  (Stores merchants, links, payments)
```

1. **Frontend (Port 3000)**: Single-page React application built with TypeScript, Tailwind CSS, and Lucide icons. Runs locally in the user's browser, sending requests to `http://localhost:5000/v1`.
2. **Backend (Port 5000)**: Express & TypeScript REST API mounted on `/v1`. Manages authentication, hashes passwords via `bcrypt`, validates JWT tokens, validates webhook secrets, and updates payment statuses.
3. **Database (MongoDB Atlas)**: Stores merchants, payment links, and payment transaction records with optimized indexes.

---



## 🗄️ Database Schemas & Collections

### 1. `Merchant`
- `email`: Merchant email (Lowercase, Unique, Indexed)
- `password`: Salted and hashed password using `bcrypt` (never plain text)
- `createdAt` & `updatedAt`: Timestamps

### 2. `PaymentLink`
- `linkId`: Short unique alphanumeric link ID (Unique)
- `merchantId`: Reference to `Merchant.uuid` )
- `amount`: Transaction amount in paise (e.g., 25000 = ₹250.00)
- `currency`: ISO currency code (`INR`)
- `description`: Link title or purpose
- `status`: Enum (`ACTIVE` | `PAID` | `EXPIRED`)
- `expiresAt`: Optional expiration date/time
- `createdAt` & `updatedAt`: Timestamps

### 3. `Payment`
- `paymentId`: Unique transaction ID (e.g., `pay_xxxxxxxx`) (Unique,)
- `linkId`: Reference to `PaymentLink.linkId` ()
- `merchantId`: Reference to `Merchant.uuid`
- `amount`: Amount in paise
- `status`: Enum (`PENDING` | `SUCCESS` | `FAILED`)
- `idempotencyKey`: Prevents duplicate payment processing (Unique, Indexed)
- `createdAt` & `updatedAt`: Timestamps

---

## 🔑 Default Merchant Credentials

The database automatically seeds a hardcoded merchant on startup if not present:

- **Email:** `merchant@payflow.internal`
- **Password:** `merchant123`

> ⚠️ **Strict Authentication Note:** Attempting to log in with an unseeded/unregistered email returns `HTTP 404 ("User is not registered")`. Entering an incorrect password returns `HTTP 401 ("Invalid password")`. No mock fallbacks are used.

---

## 🚀 How to Run on Another Computer (Step-by-Step)

### Prerequisites
1. **Node.js**: Version 18+ or 20+ ([Download Node.js](https://nodejs.org/))
2. **npm** (Bundled with Node.js)
3. **Internet connection** (for npm packages and MongoDB Atlas connection)

---

### Step 1: Clone or Copy the Repository
Transfer or clone the project folder to the new computer:
```bash
git clone <repository-url>
cd jstack
```
*(Do not copy `node_modules` or `dist` folders; install fresh dependencies in Step 2).*

---

### Step 2: Install Dependencies

Install dependencies for both the frontend and backend:

```bash
# 1. Install Frontend dependencies (in the root directory)
npm install

# 2. Install Backend dependencies
cd backend
npm install
cd ..
```

---

### Step 3: Configure Environment Variables

Create or verify the `.env` file inside the `backend/` directory:

```
cd backend 
touch .env 
```

**`backend/.env`**:
```env
# Server Port
PORT=5000

# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://testuser:oX1bfMDvXoSUMKK4@nodeprojects.wzyuizk.mongodb.net/payflow?retryWrites=true&w=majority

# Security Keys
JWT_SECRET=super_secret_payflow_jwt_key_2026
WEBHOOK_SECRET=payflow_secret_key_123

# Environment
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

### Step 4: Start Development Servers

Open **two separate terminal tabs** from the project root:

#### Terminal 1 — Start Backend Server:
```bash
npm run dev:backend
```
*(Or `cd backend && npm run dev`)*  
**Expected terminal output:**
```
🚀 Payment Flow Backend running on port 5000
📡 Base URL: http://localhost:5000/v1
🔗 API Health: http://localhost:5000/v1/health
✅ MongoDB connected successfully
```

#### Terminal 2 — Start Frontend Server:
```bash
npm run dev
```
**Expected terminal output:**
```
  ➜  Local:   http://localhost:3000/
```

---

### Step 5: Open Application

1. Open your browser and visit: **`http://localhost:3000`**
2. Check the navbar: The status pill should display a pulsing **green dot** indicating the backend is online at `:5000`.
3. Sign in using the default merchant credentials (`merchant@payflow.internal` / `merchant123`) or use the "Autofill Credentials" button.

---

## 🛠️ Available Scripts

From the root project directory:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite frontend dev server on port `3000` |
| `npm run dev:backend` | Starts backend dev server on port `5000` with hot-reload |
| `npm run build` | Builds frontend production bundle in `dist/` |
| `npm run build:backend` | Compiles backend TypeScript to `backend/dist/` |
| `npm run build:all` | Compiles both frontend and backend bundles |
| `npm run preview` | Previews the production frontend build locally |

---

## 📡 API Endpoints Overview (`/v1`)

All backend routes are prefixed with `/v1`:

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/v1/health` | Service and MongoDB health check | No |
| `POST` | `/v1/auth/login` | Merchant login (returns JWT token) | No |
| `GET` | `/v1/payment-links` | List merchant payment links | Yes (Bearer JWT) |
| `POST` | `/v1/payment-links` | Create a new payment link | Yes (Bearer JWT) |
| `GET` | `/v1/pay/:linkId` | Fetch public checkout data for a link | No |
| `POST` | `/v1/pay/:linkId` | Initialize a payment attempt | No |
| `POST` | `/v1/webhooks/provider` | Process incoming webhook event (`X-Webhook-Secret`) | Shared Secret |

---

## Security & Key Features

- **Password Hashing**: Merchant passwords are encrypted using `bcrypt` (10 salt rounds).
- **JWT Protection**: Merchant endpoints require `Authorization: Bearer <token>`.
- **Webhook Signature Verification**: Webhook receiver strictly validates the `X-Webhook-Secret` header.
- **Idempotency**: Duplicate payment and webhook requests are rejected to avoid duplicate settlements.
- **CORS Configured**: Allows cross-origin requests from the Vite frontend (`http://localhost:3000`).
- **Auto-Refresh**: Merchant dashboard automatically polls and refreshes link statuses in real time.
Auto-refresh of link status on the merchant page.

### Additional/Optional  Tasks Done 
- [x] DONE : Merchant login with JWT, so only the merchant can create and see their links.
- [x] Link expiry.
- [x] Verify a shared secret in a webhook header.
- [x] Auto-refresh of link status on the merchant page.

## potential improvements 
Security Improvements
- JWT Authentication with Refresh Tokens (httpOnly, Cookies)
- On logout flush the tokens and invalidate token.
- retries and better error handling
- logging and traces 
-  Frontend is running on local server, it can be built and then hosted on object store 
- improving code quality adding test cases
- creating documentation on swagger 
- Deploying application  on the  cloud
- Currently when user tries to access a payment link we check if it's date and time and if it is out of date we mark it as EXPIRED, two things can be improved here, time can be stored in epoch time for  Performance, Timezone Independence, 
second we can have a cron job or TTL indexes that mark these links as expired.
- Data that is sent back from backend can be mimimized according to functional requirement and payload size can be reduced (more efficiency)
- Queries can be optimized and indexing can be applied for heavy read operations.


## Note:- Sharing Secrets(.env) credentials  is breach of security ethics in engineering but i am still sharing it due to time constraints (can't host), also .env files doesn't have any any secret credentials which can cause resources abuse excpet mongouri (whose user is created with minimum access of write and read and limited to one specific database). 
