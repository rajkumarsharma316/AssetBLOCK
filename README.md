






# AssetBlock ⚡

> Programmable conditional payments and smart escrows on the Stellar Network.

AssetBlock is a decentralized application (dApp) that enables users to create, manage, and execute programmable escrow contracts. By leveraging the speed and low fees of the Stellar blockchain, AssetBlock allows you to set specific conditions (time, multi-signature approvals, or external oracle data) that must be met before funds are released.

---

## 🔗 Live App
https://asset-block.vercel.app/

## 🎥 Video

https://github.com/user-attachments/assets/3fa744c5-9ad0-4ec8-9ce2-b409dd064293

---


This project has been validated with real testnet users as part of the Level 5 requirements.

### 👥 User Validation (5+ Real Testnet Users)
The following users have successfully tested and interacted with the AssetBlock MVP on the Stellar Testnet:

#### Table 1: Name to Wallet Address Mapping

| User Name | User Email | User Wallet Address |
| :--- | :--- | :--- |
| Madhav Seth | madhav24100@iiitnr.edu.in | `GDTWHQ2P5TAMNCAHLHVNRVHVQLEECRF6AGP2PVU5QHWSKK6BMEVMURCR` |
| Mayank Dixit | mayank24100@iiitnr.edu.in | `GBAUV4WBMA4GZPNTI77O2E2GIV43JNPWOQAQEPOIITZ4BY4JHWRDANFF` |
| Harsh Kaushik | harsh.kaushik10b@gmail.com | `GBLZNJQ6IE642PDK6DLZOC6LLBVZ7XAWC2JRGVN76DZBNFD5PIUEIRDW` |
| Md Athar Sharif | md24100@iiitnr.edu.in | `GATVVSGVMVMWYBHV7MWJTMABOTEWBE4SENJLPDUYXCCPFRDFBUXYFJ2O` |
| Nandita | nanditasahu141004@gmail.com | `GBZU54GWNKN6HSIA3W6MUKF7GWJFMZBT6YBRDLQ3NZXKGN4IK5ER3O5Y` |
| Mayank Dewangan | mayank24102@iiitnr.edu.in | `GBJKZ6S7XFDNQ4J6PEDWBJI3HMC7EDNM4XBZBX3AEADD7HY2UYAU4GAF` |

### 📊 Feedback Documentation & Implementation
User feedback was collected via our in-app feedback form. We asked users specific questions regarding missing features, bugs/issues, and whether the dApp effectively solves the targeted problem. **[Download raw feedback data (Excel)](backend/data/feedback.xlsx)**.

| User Name | User Email | User Wallet Address | User Feedback | Commit ID |
| :--- | :--- | :--- | :--- | :--- |
| Madhav Seth | madhav24100@iiitnr.edu.in | `GDTWHQ...URCR` | Small numbers in the amount fields lead to mistakes; requested better visual validation. | [`6929c22`](https://github.com/rajkumarsharma316/AssetBLOCK/commit/6929c2260de5d91fe11585ad5ec64401d40d0bca) |
| Mayank Dixit | mayank24100@iiitnr.edu.in | `GBAUV4...ANFF` | Confused about contract unlock times; requested a localized countdown and timezone indicator. | [`fc12ebb`](https://github.com/rajkumarsharma316/AssetBLOCK/commit/fc12ebbbb1f43c4f0042264aa83fbe2202d8776d) |
| Harsh Kaushik | harsh.kaushik10b@gmail.com | `GBLZNJ...IRDW` | Raised concerns about global time adaptation and timezone consistency across different regions. | [`5e3c97c`](https://github.com/rajkumarsharma316/AssetBLOCK/commit/5e3c97c390bc99f17aa371c74bdc2258fab80c48) |
| Md Athar Sharif | md24100@iiitnr.edu.in | `GATVVS...FJ2O` | Found complex fields like "Oracle Data" confusing and asked for inline guidance. | [`f3ed0c8`](https://github.com/rajkumarsharma316/AssetBLOCK/commit/f3ed0c87d0c0b789412f3191cd40c6b945424339) |
| Nandita | nanditasahu141004@gmail.com | `GBZU54...3O5Y` | Reported a bug where the back button was not working during the contract creation flow. | [`a2866a7`](https://github.com/rajkumarsharma316/AssetBLOCK/commit/a2866a778a5a0e3d48fc71dc9080c65c5bfb9c23) |
| Mayank Dewangan | mayank24102@iiitnr.edu.in | `GBJKZ6...4GAF` | General positive feedback and usability testing. | N/A |

### 🚀 Future Roadmap & Evolution
Based on the collected user feedback and observations during the Level 5 validation phase, we plan to implement the following improvements in the next development cycle:

1. **Enhanced Input Validation:** Expand on the visual amount validation to include real-time fee estimations and balance checks before transaction submission.
2. **Localization & Timezones:** Build upon the localized countdown timer to allow users to select their preferred timezone when creating time-bound contracts.
3. **Inline Tutorials:** Create a guided walkthrough for first-time users, specifically focusing on complex features like "Oracle Data" and "Multi-signature setup".
4. **Improved Error Handling:** Implement a more robust error recovery system with descriptive, user-friendly messages for transaction failures.

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

*For a detailed system design and security overview, please see the [Architecture Document](ARCHITECTURE.md).*

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
