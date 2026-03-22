# 🛡️ ArtShield — Digital Art Protection Platform

> Protect your AI-generated artwork using **visual fingerprinting** and **blockchain ownership records** — so you can always prove you were first.

🌐 **Live Demo:** [artshield-pearl.vercel.app](https://artshield-pearl.vercel.app)

---

## 📌 Problem Statement

In the era of Generative AI, millions of unique artworks are created daily. Once posted online, they face two major threats:

- **The "One-Pixel" Flaw** — Traditional SHA-256 hashing breaks if even one pixel changes. A thief can slightly adjust brightness and the system treats it as a brand new image.
- **The "Middleman" Delay** — Traditional copyright registration is slow, expensive, and centralized.
- **The "AI Grey Area"** — Current laws struggle to define ownership for AI-generated art. Without a technical "proof of birth", creators can't prove they were first.

---

## ✅ Solution

ArtShield is a **Decentralized Intellectual Property (DIP) Ledger** that combines three powerful technologies:

### Phase A — Visual Fingerprint (pHash)
- Converts image to grayscale → shrinks to 32×32
- Applies Discrete Cosine Transform (DCT)
- Produces a **64-bit fingerprint** resistant to minor edits
- Uses **Hamming Distance** to detect visual similarity

### Phase B — Decentralized Storage (IPFS — Planned)
- Full image stored on IPFS
- Gets a Content Identifier (CID) across a global network

### Phase C — Immutable Judge (Blockchain)
- Smart Contract on Polygon stores: `Wallet Address + pHash + Timestamp`
- Once mined — impossible to delete or edit
- Verification checks pHash similarity against blockchain records

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🔍 **Edit-Resistant Detection** | pHash detects copies even after brightness/crop changes |
| ⚡ **Instant Registration** | Register artwork in seconds |
| 🔒 **Immutable Proof** | Blockchain records can never be altered |
| 👤 **Owner Identity** | Name and email permanently linked to artwork |
| 🕐 **Timestamped** | Exact registration time proves you were first |
| 📋 **Persistent History** | All registered artworks stored per user in PostgreSQL |
| 🔐 **Google Authentication** | Secure login via NextAuth.js |
| 🆓 **100% Free** | No subscription, no hidden fees |

---

## 🛠️ Tech Stack

| Layer | Technology | Role |
|---|---|---|
| **Frontend** | Next.js + TypeScript | User interface |
| **Authentication** | NextAuth.js + Google OAuth | Secure login |
| **Backend** | Python + FastAPI | API + pHash logic |
| **Image Analysis** | ImageHash + Pillow | Visual fingerprinting |
| **Database** | PostgreSQL (Neon) | Persistent storage |
| **Blockchain** | Polygon (Amoy Testnet) | Ownership records |
| **Smart Contracts** | Solidity | Immutable ownership laws |
| **Deployment** | Vercel + Render | Frontend + Backend hosting |

---

## 📁 Project Structure

```
artshield/                    # Frontend (Next.js)
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/page.tsx        # Login page
│   ├── dashboard/page.tsx    # Main dashboard
│   ├── blockchain.ts         # Smart contract integration
│   ├── Providers.tsx         # NextAuth provider
│   └── layout.tsx            # Root layout
└── components/

artshield-backend/            # Backend (Python)
├── main.py                   # FastAPI app
└── requirements.txt
```

---

## ⚙️ How It Works

```
1. User signs in with Google
        ↓
2. User uploads AI-generated artwork
        ↓
3. Backend generates pHash (64-bit visual fingerprint)
        ↓
4. System compares with all existing artworks
        ↓
5. If similarity < 85% → ORIGINAL → saved to PostgreSQL
   If similarity ≥ 85% → COPY DETECTED → original owner shown
        ↓
6. (Optional) Register on Polygon blockchain for permanent proof
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL database (Neon recommended)

### Frontend Setup

```bash
cd artshield
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

```bash
npm run dev
```

### Backend Setup

```bash
cd artshield-backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

Create `.env`:
```env
DATABASE_URL=your_postgresql_connection_string
```

```bash
uvicorn main:app --reload
```

---

## 🌐 Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | [artshield-pearl.vercel.app](https://artshield-pearl.vercel.app) |
| Backend | Render | [artshield.onrender.com](https://artshield.onrender.com) |
| Database | Neon (PostgreSQL) | Cloud hosted |

---

## 📸 Screenshots

### Landing Page
- Hero section with animated neural network background
- How it works, Features, Tech Stack sections

### Dashboard
- Upload artwork with drag & drop
- Visual fingerprint + ownership results
- Persistent history of all registered artworks

---

## 🔮 Future Improvements

- [ ] IPFS integration for decentralized image storage
- [ ] Deploy Smart Contract to Polygon Amoy Mainnet
- [ ] Email notifications when copy detected
- [ ] Public verification page
- [ ] Mobile app

---

## 👩‍💻 Built By

**Chandrika Kesiboyina**
CSE (AI & ML) — 3rd Year Student

> ArtShield was built as a project combining AI, blockchain, and full-stack development — to solve the real problem of digital art theft in the age of generative AI.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

⭐ If you found this useful, please give it a star!
