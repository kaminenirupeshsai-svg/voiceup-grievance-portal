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
│   └── partials/     # Shared head/sidebar chrome used by every dashboard
├── routes/           # Express routers (auth, admin, complaint, grievance, officer, dashboard, pages)
├── models/           # Mongoose schemas (User, Complaint)
├── middleware/       # Route guards (requireRole) and file upload handling (multer)
├── utils/            # Email notifications (mailer, notify)
├── uploads/           # Complaint attachments (gitignored, runtime-only)
└── server.js         # App entry point
```

# 🛠️ Installation & Setup

1. Clone the repository
   ```
   git clone https://github.com/kaminenirupeshsai-svg/voiceup-grievance-portal.git
   cd voiceup-grievance-portal
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

   # optional — email notifications, disabled if left blank
   SMTP_HOST=
   SMTP_PORT=587
   SMTP_USER=
   SMTP_PASS=
   FROM_EMAIL=
   ```
4. Start the server
   ```
   npm start
   ```

# 👤 Roles & Accounts

Only students self-register (`/register.html`). Admin, Grievance Cell, and
Officer accounts can only be created from inside the Admin Panel
(`/admin/users/new`), which requires being logged in as an admin —
so the very first admin has to be bootstrapped directly:

```
node scripts/create-admin.js "Full Name" admin@example.com yourpassword
```

Run this once against your target database (local or the deployed
`MONGO_URL`). After that, log in at `/admin-login` and use **Manage Users**
to create Grievance Cell and Officer accounts through the UI — no more
scripts needed.

| Role | Purpose |
|---|---|
| Student | Files complaints, tracks status, rates resolutions |
| Grievance Cell | Triages new complaints; marks "In Process" or escalates to an Officer |
| Grievance Officer | Resolves escalated complaints |
| Admin | Full oversight: all complaints, assignment, analytics, user management |

# ☁️ Deployment (Render)

This repo includes a `render.yaml` Blueprint for one-click setup on [Render](https://render.com):

1. Push this repo to GitHub (already done if you're reading this from the deployed repo).
2. On Render: **New → Blueprint**, connect the `voiceup-grievance-portal` repo, and it will read `render.yaml` automatically.
3. Render will prompt for the env vars marked `sync: false` — set at minimum:
   - `MONGO_URL` — your MongoDB Atlas connection string
   - `SESSION_SECRET` — any long random string
   - SMTP vars are optional; leave blank to keep email notifications disabled
4. Deploy. Render assigns `PORT` automatically — the app already reads `process.env.PORT`.

**Known limitation:** complaint attachments are stored on local disk via `multer`. Render's free tier has an **ephemeral filesystem** — uploaded files are wiped on every redeploy/restart. For production-durable attachments, swap the storage in `middleware/upload.js` for an object store (e.g. S3, Cloudinary) or add a [Render persistent disk](https://render.com/docs/disks) (paid).

# 📜 License

This project is open source under the MIT License.

# 🎯 Final Notes

E-Grievance Hub is designed to:
* Improve transparency
* Speed up grievance resolutions
* Create accountability in institutions
* Offer a clean, tech-driven workflow for students and administration
