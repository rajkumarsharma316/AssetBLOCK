# AssetBlock Architecture

This document outlines the high-level architecture and system design of the AssetBlock decentralized application.

## Overview

AssetBlock is a full-stack dApp that facilitates programmable conditional payments and smart escrows on the Stellar Network. It utilizes a React-based frontend for user interaction, a Node.js/Express backend for API services and transaction preparation, and a PostgreSQL database (via Supabase) for off-chain data persistence. The core settlement layer is the Stellar blockchain.

## System Diagram

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

## Components

### 1. Frontend (Client Layer)
- **Framework:** React built with Vite.
- **Routing:** React Router for client-side navigation.
- **Wallet Integration:** Integrates with `@stellar/freighter-api` to securely request the user's public key and prompt for transaction signatures without exposing the private key to the application.
- **Stellar SDK:** Uses `@stellar/stellar-sdk` to decode and verify XDR payloads, and to build transactions on the client side when necessary.
- **Hosting:** Deployed continuously via Vercel.

### 2. Backend (Service Layer)
- **Framework:** Node.js with Express.js.
- **Authentication (`/auth`):** Implements a SEP-10 style authentication flow. It issues a challenge transaction (XDR) which the client must sign via their wallet. The backend verifies the signature and issues a JWT for subsequent authorized requests.
- **Contract Management (`/contracts`):** Provides endpoints to create new escrows, retrieve user-specific contracts, and update contract statuses. It handles the generation of complex Stellar transactions (like multi-sig setups or time-bounds) and returns them to the frontend as XDRs for the user to sign.
- **Monitoring Service (`services/monitor.js`):** A background worker or scheduled task that monitors the Stellar blockchain for incoming payments to the escrow accounts or triggers release conditions when oracle data or time constraints are met.
- **Hosting:** Deployed via Render.

### 3. Data Persistence (Storage Layer)
- **Database:** Supabase (managed PostgreSQL).
- **Purpose:** While the source of truth for funds and final settlement is the Stellar blockchain, the database is used to store metadata about contracts (e.g., descriptions, off-chain signer identities, pending transaction XDRs, and user feedback) to provide a responsive and complete user experience.

### 4. Blockchain (Settlement Layer)
- **Network:** Stellar Testnet.
- **Interaction:** The application interacts with the Stellar network through the public Horizon API.
- **Smart Contracts:** Currently implemented using native Stellar operations (time-bounds, multi-sig on accounts). The architecture is designed to eventually support Soroban smart contracts as the ecosystem matures.

## Security Model

- **Non-Custodial:** AssetBlock never holds the user's private keys. All transactions that move user funds must be explicitly signed by the user via the Freighter wallet.
- **Stateless Authentication:** JWTs are used to authorize backend API calls, preventing unauthorized access to sensitive contract metadata.
- **Signature Verification:** The backend rigorously verifies the cryptographic signatures on XDR payloads before processing them.
