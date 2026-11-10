# EaseAcad — API (Backend)

Render:(https://easeacad-backend.onrender.com)

> RESTful web service and relational database layer powering the EaseAcad platform.

- **Project:** Field Project — Semester III
- **Program:** BSc IT / BVoc Software Development
- **Author:** Aryan Birmole (UID: 25BIT008)
- **Frontend App Repository:** [aryanbirmole/easeacad](https://github.com/aryanbirmole/easeacad)

---

## Architecture & Security

- **Stateless Authentication:** JSON Web Tokens (JWT) for secure user sessions with bcrypt password encryption.
- **Data Isolation:** User-level ownership verified via SQL `JOIN` clauses across all subject, note, and task queries.
- **Cloud Relational Storage:** Managed MySQL on Aiven with SSL certificate verification (`ca.pem`).

---

## API Summary

| Endpoint Group | Description |
|---|---|
| `/api/auth` | User registration, login authentication, and token verification |
| `/api/subjects` | CRUD operations for organizing academic subjects |
| `/api/notes` | Subject-scoped notes and embedded reference links |
| `/api/tasks` | Urgency-filtered task management and partial updates |
| `/api/dates` | Milestone tracking and upcoming 7-day deadlines (`/upcoming?days=7`) |
| `/api/dashboard` | Metric aggregation (`/stats`, `/upcoming`, `/this-week`) |
| `/api/search` | Multi-table indexed search across subjects, notes, tasks, and dates |

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL (Cloud-hosted via Aiven)
- **Security:** JWT, bcrypt, SSL
- **Testing:** Thunder Client
- **Deployment:** Render

---

## Roadmap

- **External Calendar Sync:** Export academic deadlines via standard iCal / `.ics` feeds.
- **Cache Optimization:** In-memory caching for frequently accessed dashboard aggregates.
