# PayFlow Backend Service

Production-ready backend built with **Node.js, Express, TypeScript, and Mongoose (MongoDB)**.

## Environment Configuration
Set MONGODB_URI in `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/payflow?retryWrites=true&w=majority
JWT_SECRET=super_secret_payflow_jwt_key_2026
WEBHOOK_SECRET=payflow_secret_key_123
NODE_ENV=development
```

## Run Commands
```bash
cd backend
npm run dev
```
