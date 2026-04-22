# AssetBlock ⚡

> Programmable conditional payments and smart escrows on the Stellar Network.

AssetBlock is a decentralized application (dApp) that enables users to create, manage, and execute programmable escrow contracts. By leveraging the speed and low fees of the Stellar blockchain, AssetBlock allows you to set specific conditions (time, multi-signature approvals, or external oracle data) that must be met before funds are released.

---

## 🎥 Demo Preview

<!-- PLACEHOLDER: Insert a link to a GIF or short MP4 video demonstrating the core user flow (creating a contract, funding it, and the conditions being met). -->
> **[Video Placeholder]**
> `![AssetBlock Demo Video](./docs/demo-video.gif)`

---

## ✨ Features

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

## 📸 Screenshots

### Desktop Experience
<!-- PLACEHOLDER: Insert desktop screenshots here -->
<p align="center">
  <img src="https://via.placeholder.com/800x450.png?text=Desktop+Dashboard+Screenshot" alt="Desktop Dashboard" width="48%" />
  <img src="https://via.placeholder.com/800x450.png?text=Desktop+Contract+Details+Screenshot" alt="Desktop Contract Details" width="48%" />
</p>

### Mobile Experience
<!-- PLACEHOLDER: Insert mobile screenshots here -->
<p align="center">
  <img src="https://via.placeholder.com/300x600.png?text=Mobile+Login" alt="Mobile Login" width="30%" />
  <img src="https://via.placeholder.com/300x600.png?text=Mobile+Dashboard" alt="Mobile Dashboard" width="30%" />
  <img src="https://via.placeholder.com/300x600.png?text=Mobile+Contract" alt="Mobile Contract Details" width="30%" />
</p>

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
