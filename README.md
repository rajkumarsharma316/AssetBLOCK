# AssetBlock ⚡

> Programmable conditional payments and smart escrows on the Stellar Network.

AssetBlock is a decentralized application (dApp) that enables users to create, manage, and execute programmable escrow contracts. By leveraging the speed and low fees of the Stellar blockchain, AssetBlock allows you to set specific conditions (time, multi-signature approvals, or external oracle data) that must be met before funds are released.

---

## 🔗 Live App
https://asset-block.vercel.app/

## 🎥 Video
<!-- PLACEHOLDER: Insert a link to a demo video showing full MVP functionality -->
(https://github.com/user-attachments/assets/76a81a99-593a-4a28-84d3-9a4e2aae8acb)

---



### 📊 Feedback Documentation
User feedback was collected via in app feedback form, asking users to rate the product and provide suggestions.
<img width="1566" height="825" alt="image" src="https://github.com/user-attachments/assets/1045e4b6-582d-481f-ada8-47d206c1aad9" />
- **[Excel Sheet Responses Link Placeholder]**

### 🔄 Iteration & Improvements
Based on the collected user feedback, the following improvements were planned and implemented:
- **Improvement 1**: `Added Buitton to toggke over dark/light mode`






---

## ✨ Key Features

- **Freighter Wallet Integration**: Secure, seamless one-click login and transaction signing using the official Freighter extension via SEP-10 style XDR authentication.
- **Smart Contract Conditions**:
  - ⏱️ **Time-based**: Funds are locked until a specific date and time.
  - 👥 **Approval-based (Multi-sig)**: Requires *N* out of *M* designated signers to approve the payment before release.
  - 🔮 **Oracle-based**: Triggers payment release based on external real-world data (e.g., asset prices hitting a target).
- **Automated Funding**: Easy testnet onboarding with automated account generation and Friendbot funding.
- **Modern UI/UX**: A vibrant, glassmorphic design system tailored for a premium user experience.
- **Responsive Design**: Fully optimized for both desktop and mobile web experiences.
- **Persistent Cloud Data**: Fast and reliable backend using Supabase (PostgreSQL).

---

## 📸 UI Screenshots

### Desktop Experience
<!-- PLACEHOLDER: Insert desktop screenshots here -->

<p align="center">
  <img width="1919" height="911" alt="image" src="https://github.com/user-attachments/assets/77c7fb71-7081-46a6-9322-7bcae8a733ae" />
  <img width="1919" height="899" alt="image" src="https://github.com/user-attachments/assets/090055f6-33b0-4808-9d6a-95d35db05c83" />
</p>

### Mobile Experience
<!-- PLACEHOLDER: Insert mobile screenshots here -->
<p align="center">
  <img width="30%" alt="image" src="https://github.com/user-attachments/assets/74cd9461-c3fa-47ef-9c76-ad0769fe5299" /> <img width="30%" alt="image" src="https://github.com/user-attachments/assets/96fa56a6-ab46-46ac-8bc9-757d33c3230e" />
</p>

---

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────────┐
│              USER (Freighter Wallet)            │
└────────────────────┬────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│              React Frontend (Vite)              │
│       Dashboard · Create Escrow · Details       │
└────────────────────┬────────────────────────────┘
                     │ REST API / XDR Payloads
                     ▼
┌─────────────────────────────────────────────────┐
│              Node.js Backend (Express)          │
│       Auth · Contract Services · Monitor        │
└────────────────────┬────────────────────────────┘
                     │ Data    │ Tx Submission
                     ▼         ▼
┌──────────────────────┐  ┌───────────────────────┐
│ Supabase (PostgreSQL)│  │ Stellar Testnet       │
│ Contracts & Signers  │  │ Horizon API           │
└──────────────────────┘  └───────────────────────┘
```

---

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- React Router
- Vanilla CSS (Glassmorphism, custom responsive design)
- `@stellar/stellar-sdk` & `@stellar/freighter-api`
- Deployed on **Vercel**

**Backend:**
- Node.js & Express
- Supabase (PostgreSQL)
- Deployed on **Render**

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- A Supabase account / project for PostgreSQL
- Freighter Wallet browser extension

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/AssetBLOCK.git
cd AssetBLOCK
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory based on `.env.example`:
```env
PORT=3000
DATABASE_URL=your_supabase_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
```
Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```
Start the frontend:
```bash
npm run dev
```
Access the application at `http://localhost:5173`.

---

## 🔐 How Wallet Authentication Works

AssetBlock supports modern wallet authentication. When you log in with **Freighter**, the application:
1. Requests your public key from the extension.
2. The backend generates a secure cryptographic challenge (XDR).
3. Freighter prompts you to sign this challenge.
4. The backend verifies the signature against your public key to authenticate you without ever exposing your secret key.

*You can also generate a temporary Testnet keypair or import an existing secret key directly for rapid prototyping.*

---

## 📄 License
This project is licensed under the MIT License.
