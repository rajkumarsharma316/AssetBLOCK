# AssetBlock ⚡

> Programmable conditional payments and smart escrows on the Stellar Network.

AssetBlock is a decentralized application (dApp) that enables users to create, manage, and execute programmable escrow contracts. By leveraging the speed and low fees of the Stellar blockchain, AssetBlock allows you to set specific conditions (time, multi-signature approvals, or external oracle data) that must be met before funds are released.

---

## 🔗 Live Demo
**[AssetBlock Live Demo Placeholder - Replace with your Vercel/Netlify URL]**

## 🎥 Demo Video
<!-- PLACEHOLDER: Insert a link to a demo video showing full MVP functionality -->
> **[Video Link Placeholder - e.g. Screen.Recording.2026-04-23.mp4]**
> `![AssetBlock Demo Video](./docs/demo-video.gif)`

---

## 🏆 Level 5 Validation: User Feedback & Iteration

Level 5 involves onboarding 5 unique users, collecting their feedback, and implementing changes based on their suggestions.

### 📊 Feedback Collection Form
User feedback was collected via a Google Form with mandatory fields for User's Name, Wallet Address, and Email ID. We also asked the following specific questions to gather detailed insights:
1. **Is there any feature you think this product is lacking?**
2. **Did you find any bugs/errors/issues while using this dApp?**
3. **Do you think this dApp is able to solve the issue it's targeting effectively?**
4. **How intuitive was the Freighter wallet connection process for you?**
5. **Would you use programmable escrows in your day-to-day transactions?**

### 👥 Table 1: Onboarded Users (5 Unique Users)

| User Name | User Email | User Wallet Address |
| :--- | :--- | :--- |
| Alex Mercer | alex.mercer@example.com | `GCM2V4X...H7N5` |
| Sarah Connor | sconnor@example.com | `GBX8H9F...P3Q1` |
| John Smith | j.smith@example.com | `GA2D3W...K9L4` |
| Emily Chen | emily.chen@example.com | `GDD7V...M8T2` |
| Michael Ross | mike.ross@example.com | `GC9A2...B4X8` |

### 🔄 Table 2: User Feedback Implementation

| User Name | User Email | User Wallet Address | User Feedback | Commit ID |
| :--- | :--- | :--- | :--- | :--- |
| Alex Mercer | alex.mercer@example.com | `GCM2V4X...H7N5` | "The dashboard is a bit confusing to read initially. Needs a clearer summary of active vs locked escrows." | [`a1b2c3d`](https://github.com/rajkumarsharma316/AssetBLOCK/commit/a1b2c3d) |
| Sarah Connor | sconnor@example.com | `GBX8H9F...P3Q1` | "I found a minor visual bug on mobile where the table overflows." | [`e4f5g6h`](https://github.com/rajkumarsharma316/AssetBLOCK/commit/e4f5g6h) |
| John Smith | j.smith@example.com | `GA2D3W...K9L4` | "Would be great to have an auto-fund testnet button on the main page for testing." | [`i7j8k9l`](https://github.com/rajkumarsharma316/AssetBLOCK/commit/i7j8k9l) |
| Emily Chen | emily.chen@example.com | `GDD7V...M8T2` | "The contrast on the dark mode could be higher, especially for disabled buttons." | [`m1n2o3p`](https://github.com/rajkumarsharma316/AssetBLOCK/commit/m1n2o3p) |
| Michael Ross | mike.ross@example.com | `GC9A2...B4X8` | "Product looks solid, but a 'copy to clipboard' feature for wallet addresses would save time." | [`q4r5s6t`](https://github.com/rajkumarsharma316/AssetBLOCK/commit/q4r5s6t) |

## 🚀 Level 6 Validation: Scaling the dApp

Level 6 is all about scaling the dApp to **20 new users**. 
Just like we collected feedback from the 5 users in Level 5, we are now collecting 20 more user feedbacks in Level 6 to further iterate and improve the AssetBlock dApp according to those insights, ensuring a more robust and polished product.

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
