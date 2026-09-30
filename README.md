
# 🏢 UPLIN

### From 2D Building Information to Interactive 3D Visualization

UPLIN is a smart platform that transforms **traditional 2D building information into an interactive 3D building experience**.

Users can explore a building, switch between floors, view facilities, and check its verification status.
Authorized government officials can review complaints and update the building's verification status when required.

---

## 🚨 Problem

Traditional building information is often presented through:

* 2D maps
* Static images
* Text-based information
* Separate sources

This makes it difficult for users to understand the **actual structure, floors, and facilities of a building**.

There is also no simple connection between **building information, verification, complaints, and government review**.

---

## 💡 Our Solution

UPLIN converts building information into an **interactive 3D visualization**.

```text
2D Building Information
          ↓
   UPLIN Platform
          ↓
Interactive 3D Building
          ↓
   Floor Navigation
          ↓
Building & Facility Information
          ↓
 Verification Status
```

Users can visually explore the building instead of only reading static information.

---

# ⭐ Key Features

### 🏢 Interactive 3D Building

Transform 2D building information into an interactive 3D representation.

### 🗺️ Map-Based Exploration

Users can locate and select buildings through the map.

### 🏬 Floor Navigation

Users can switch between floors and view floor-specific information.

### ✅ Verification

Verified buildings display a **Verified** badge.

### 📢 Complaint System

Users can report issues related to a building.

### 🏛️ Government Review

Authorized government officials can review complaints and take action.

### 🔄 Verification Revocation

A complaint does **not** immediately remove verification.

```text
Complaint
    ↓
Government Review
    ↓
 ┌───────────┐
 │  Decision │
 └─────┬─────┘
       │
   ┌───┴────┐
   ↓        ↓
Rejected  Confirmed
   ↓        ↓
Keep      Remove
Verified  Verified Badge
```

---

# 👥 Three Modes

### 👤 User Mode

Explore buildings, view the 3D model, navigate floors, check facilities and verification, and submit complaints.

### 🏛️ Government Mode

Review complaints, investigate reported issues, and revoke verification when a complaint is confirmed.

### ⚙️ Admin Mode

Manage users, buildings, roles, and overall platform data.

---

# 🔄 Project Flow

```text
       MAP
        ↓
    SELECT BUILDING
        ↓
   3D VISUALIZATION
        ↓
    SELECT FLOOR
        ↓
 VIEW ROOMS & FACILITIES
        ↓
 CHECK VERIFICATION
        ↓
   SUBMIT COMPLAINT
        ↓
 GOVERNMENT REVIEW
        ↓
 UPDATE VERIFICATION
```

---

# 🛠️ Technology Stack

* **Frontend:** React, JavaScript, HTML, CSS
* **Backend:** REST API
* **Database:** SQLite
* **Authentication:** Role-based authentication
* **3D Visualization:** Web-based 3D rendering
* **Version Control:** Git & GitHub

---

# 🚀 Run Locally

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd UPLIN
```

### 2. Install dependencies

```bash
cd frontend
npm install
```

For the backend:

```bash
cd ../backend
npm install
```

### 3. Configure environment variables

Create `.env` from `.env.example`.

```env
PORT=5000
DATABASE_URL=./database.sqlite
JWT_SECRET=your_secret_key
```

### 4. Start the backend

```bash
npm run dev
```

### 5. Start the frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

Open the URL shown in the terminal, usually:

```text
http://localhost:5173
```

---

# 📁 Project Structure

```text
UPLIN/
├── frontend/       # User interface & 3D visualization
├── backend/        # APIs, authentication & business logic
├── database/       # Database configuration
├── uploads/        # Local files/images
├── .env.example
└── README.md
```

---

# 🏆 SIH Project

UPLIN is developed as a **Smart India Hackathon (SIH)** project.

### Core Idea

> **Convert 2D building information into an interactive 3D experience while connecting users, verification, complaints, and government review in one platform.**

---

# 👥 Team & Contributors

| # | Name      | Role      | Contribution      | GitHub        |
| - | --------- | --------- | ----------------- | ------------- |
| 1 | Your Name | Your Role | Your Contribution | [GitHub](LINK) |
| 2 | Member 2  | Role      | Contribution      | [GitHub](LINK) |
| 3 | Member 3  | Role      | Contribution      | [GitHub](LINK) |
| 4 | Member 4  | Role      | Contribution      | [GitHub](LINK) |
| 5 | Member 5  | Role      | Contribution      | [GitHub](LINK) |
| 6 | Member 6  | Role      | Contribution      | [GitHub](LINK) |

---

### 🔗 Links

* **GitHub:** YOUR_REPOSITORY_LINK
