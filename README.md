# E-Grievance Portal

A complete web-based platform designed to streamline the submission, tracking, and resolution of grievances for universities and institutions.

# 🌟 Overview

E-Grievance Hub is a digital platform that connects Students, Admins, and Grievance Officers in a single transparent workflow.
It eliminates manual paperwork and delays by enabling online grievance submission and processing.
The system provides real-time updates, tracking, and accountability for efficient campus grievance management.

# 🚀 Key Features

## 🧑‍🎓 For Students
* File grievances quickly
* Choose department, grievance type, priority
* Track real-time grievance progress
* Anonymous grievance option

## 🧑‍💼 For Admins
* View grievances assigned to their department
* Change status: Pending → In Review → Resolved
* Add solution notes & timeline
* Manage student queries

## 🏛️ For Grievance Officers
* Handle escalated complaints
* Add remarks and mark complaints resolved
* View resolution history

# 🧩 Tech Stack

## Frontend
* HTML
* CSS
* JavaScript (EJS templates)

## Backend
* Node.js
* Express.js
* MongoDB + Mongoose

# 🔐 System Architecture

```
                   ┌────────────────────────────────┐
                   │       Frontend                 │
                   │  - Student UI                  │
                   │  - Admin Dashboard              │
                   │  - Grievance Officer Panel      │
                   └────────────────────────────────┘
                                   │
                                   ▼
                       ┌─────────────────────┐
                       │    Express Server   │
                       └─────────────────────┘
                                   │
        ┌────────────────────────────────────────────────────────────┐
        │                            │                               │
        ▼                            ▼                               ▼
┌──────────────┐      ┌───────────────────────┐         ┌───────────────────────┐
│ Authentication│      │  Grievance Services  │         │  Admin/Officer        │
│ Sessions +    │      │  CRUD + Status Flow  │         │  Assignment & Reports │
│ Middleware    │      │                      │         │                       │
└──────────────┘      └───────────────────────┘         └───────────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │   MongoDB Database   │
                        │ Users / Complaints   │
                        └──────────────────────┘
```

# 📁 Project Structure

```text
Egrivance/
│
├── public/           # Static pages served directly (landing, login forms, styles)
├── views/            # EJS templates rendered from live database data
├── routes/           # Express routers (auth, admin, complaint, grievance, officer, dashboard, pages)
├── models/           # Mongoose schemas (User, Complaint)
├── middleware/       # Route guards (requireAdmin)
└── server.js         # App entry point
```

# 🛠️ Installation & Setup

1. Clone the repository
   ```
   git clone https://github.com/yourusername/egrievance-hub.git
   cd egrievance-hub
   ```
2. Install dependencies
   ```
   npm install
   ```
3. Configure environment variables in `.env`
   ```
   MONGO_URL=your-mongodb-connection-string
   SESSION_SECRET=your-session-secret
   PORT=5000
   ```
4. Start the server
   ```
   npm start
   ```

# 📜 License

This project is open source under the MIT License.

# 🎯 Final Notes

E-Grievance Hub is designed to:
* Improve transparency
* Speed up grievance resolutions
* Create accountability in institutions
* Offer a clean, tech-driven workflow for students and administration
