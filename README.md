# Campus Notice Management System

A role based campus notice portal built with React, Express, and MySQL. Faculty and societies submit notices for review; HODs approve notices within their department, administrators review pending notices and manage accounts, and students see published notices targeted to their department and semester.

## Features and roles

- **Admin:** review all pending notices; approve or reject with a reason; create student, faculty, HOD, and society accounts; activate or deactivate accounts.
- **HOD:** review notices targeted exclusively to the HOD's department; approve or reject them with a reason.
- **Faculty:** submit notices for their own department and track submission status and rejection reasons.
- **Society:** submit notices for selected departments and semesters and track status.
- **Student:** browse published notices matching their own department and semester.

Notice workflow: `Pending` after submission → `Published` after approval or `Rejected` after rejection. Approval records the approver and timestamps publication. Notice targeting can be department wide or semester specific; `NULL` target values represent all departments or semesters.

## Tech stack

- Frontend: React 19, Vite 8, Axios, lucide-react.
- Backend: Node.js, Express 5, MySQL 8 compatible SQL, mysql2, bcrypt, JSON Web Tokens, dotenv, and CORS.
- Database scripts: `database/schema.sql`, `database/sample_data.sql`, and `database/queries.sql`.

## Requirements

Install a current Node.js release supported by Vite 8 and MySQL 8 (or a compatible MySQL server). The frontend development server defaults to `http://localhost:5173`; the API defaults to port `3000`.

## Setup

1. Create the database by running `database/schema.sql` in MySQL. This script creates and selects `campus_notice_db`.
2. Configure the backend environment in `backend/.env`:

   ```dotenv
   DB_HOST=localhost
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=campus_notice_db
   JWT_SECRET=replace_with_a_long_random_secret
   PORT=3000
   ```

3. Install backend dependencies and start the API:

   ```sh
   cd backend
   npm install
   npm run dev
   ```

   Use `npm start` for a non-watching start.

4. In a second terminal, install frontend dependencies and start Vite:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

5. Open the Vite URL shown in the terminal. The frontend API client uses `VITE_API_URL`; if unset, provide `http://localhost:3000/api` in `frontend/.env`.

The backend CORS configuration currently allows `http://localhost:5173`. Update it for a different frontend origin before deploying.

### Database setup note

`database/schema.sql` defines `USER.Is_Active` with a default of `TRUE`, matching the existing runtime queries. `database/sample_data.sql` contains placeholder password hashes (`TEMP_HASH_*`), so those records are not usable as login credentials.

## Database overview

The schema defines these entities:

- `DEPARTMENT` and `CATEGORY` hold lookup data.
- `USER` stores identity, password hash, role, and creation time. Roles are Admin, HOD, Faculty, Student, and Society.
- `STUDENT_PROFILE` extends a student user with roll number, department, semester, and batch year.
- `FACULTY_PROFILE` extends faculty and HOD users with employee code, department, and designation.
- `NOTICE` stores content, priority, status, dates, creator, category, approval metadata, and rejection reason.
- `NOTICE_TARGET` associates a notice with a department and optional semester. Multiple rows support multiple audiences.
- `NOTICE_ATTACHMENT` stores attachment metadata and cascades when a notice is deleted.
- `BOOKMARK` is a composite-key join between users and notices.

ERD relationships: `DEPARTMENT 1—many STUDENT_PROFILE`; `DEPARTMENT 1—many FACULTY_PROFILE`; `USER 1—0/1 STUDENT_PROFILE`; `USER 1—0/1 FACULTY_PROFILE`; `USER 1—many NOTICE` as creator and approver; `CATEGORY 1—many NOTICE`; `NOTICE 1—many NOTICE_TARGET`; `DEPARTMENT 1—many NOTICE_TARGET` (nullable audience department); `NOTICE 1—many NOTICE_ATTACHMENT`; and `USER many—many NOTICE` through `BOOKMARK`.

## API endpoints

All endpoints are mounted below `/api`. Protected endpoints require `Authorization: Bearer <JWT>` unless noted.

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Public | Sign in using email and password; returns a two hour JWT and user profile. |
| GET | `/notices` | Public | List published notices. |
| POST | `/notices/submit` | Faculty, Society | Submit notice body, priority, category, optional expiry and one or more targets. Faculty targets are restricted to their department. |
| GET | `/notices/pending` | Admin, HOD | List pending notices; HOD results are scoped to their department. |
| PUT | `/notices/:noticeId/approve` | Admin, HOD | Approve a pending notice; HODs can approve only notices solely for their department. |
| PUT | `/notices/:noticeId/reject` | Admin, HOD | Reject a pending notice; JSON body requires `reason`. |
| GET | `/notices/mine` | Faculty, Society | List the authenticated user's notices and their status. |
| GET | `/notices/options` | Faculty, Society | Return categories and available departments (Faculty sees their own department). |
| GET | `/notices/student/:studentId` | Authenticated | Return published notices matching the student's profile. Students are restricted to their own ID. |
| GET | `/users` | Admin | List user accounts. |
| POST | `/users` | Admin | Create a Student, Faculty, HOD, or Society account; response includes a generated temporary password. |
| PATCH | `/users/:id/deactivate` | Admin | Deactivate an account; an administrator cannot deactivate their own account. |
| PATCH | `/users/:id/activate` | Admin | Reactivate an account. |
| GET | `/` | Public | API welcome message. |
| GET | `/api/health` | Public | Check MySQL connectivity. |

## Security notes

- Passwords are hashed with bcrypt; SQL values are parameterized.
- Login checks account activation, and issues signed, expiring JWTs. Set a unique, strong `JWT_SECRET` and keep environment files private.
- Authentication middleware verifies JWTs; role middleware and route-level checks enforce role and department restrictions.
- The frontend stores JWTs in `localStorage`; protect the application against cross-site scripting and consider a safer token storage approach for production.
- CORS currently permits only the local Vite origin. There is no rate limiting configured in the repository.

## Testing and checks

The project owner reported that the role workflows had already been tested manually, including the Faculty-to-HOD flow and role dashboards. No automated backend test suite is present (`backend/package.json` has a placeholder test script). Frontend scripts provide `npm run lint` and `npm run build`.

## Repository map

```text
backend/       Express API, routes, middleware, MySQL connection
database/      schema, sample data, example SQL queries
frontend/      React/Vite application and role dashboards
```

See [`documentation/PROJECT_REPORT.md`](documentation/PROJECT_REPORT.md) for a report-style overview and schema discussion.
