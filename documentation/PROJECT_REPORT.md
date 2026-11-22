# Campus Notice Management System — Project Report

## 1. Abstract

The Campus Notice Management System provides a single web portal for creating, reviewing, publishing, and viewing campus notices. Notices carry a category, priority, expiry date, and audience targets. Faculty and societies submit notices; administrative reviewers approve or reject them; students view published notices relevant to their academic profile.

## 2. Objectives and scope

- Centralize campus announcements.
- Route notices through a review process before publication.
- Restrict faculty submissions and HOD review to department scope.
- Target notices to departments and semesters.
- Provide account creation and activation controls to administrators.

The inspected implementation contains Admin, HOD, Faculty, Society, and Student dashboards. Attachments and bookmarks have schema tables but are not exposed through the inspected API routes.

## 3. Technology

React 19 and Vite 8 provide the browser client. Axios communicates with an Express 5 API. MySQL stores accounts, profiles, notices, audiences, and lookup data. Bcrypt hashes passwords and JWTs authenticate protected API calls.

## 4. Roles and workflows

1. An administrator provisions users. Student accounts have a student profile; Faculty and HOD accounts have a faculty profile and department.
2. Faculty submits a notice targeting their own department. A Society can submit for selected departments and semesters. Submission creates a `Pending` notice and target rows in one transaction.
3. An HOD reviews pending notices in their department. HOD approval/rejection is constrained to notices targeted solely to that department. Admin can review pending notices across departments.
4. Approval changes status to `Published` and records approver and publication timestamps. Rejection changes status to `Rejected` and records the reason.
5. Student notice retrieval joins the student profile to matching audience targets and returns published notices.

## 5. Database schema and ERD explanation

The relational schema is in `database/schema.sql`.

| Entity | Role and relationships |
|---|---|
| `DEPARTMENT` | Lookup table referenced by student/faculty profiles and notice targets. |
| `CATEGORY` | Lookup table referenced by each notice. |
| `USER` | Base account entity; referenced by student/faculty profiles, notice creator, and approver. |
| `STUDENT_PROFILE` | One-to-one extension of a Student account; stores roll number, department, semester, batch year. |
| `FACULTY_PROFILE` | One-to-one extension of Faculty/HOD account; stores department and designation. |
| `NOTICE` | Content and workflow record; references creator, category, and optional approver. |
| `NOTICE_TARGET` | Audience association from notice to optional department and optional semester; allows multiple targets. |
| `NOTICE_ATTACHMENT` | Attachment metadata belonging to a notice; notice deletion cascades. |
| `BOOKMARK` | Many-to-many association between users and notices using `(User_ID, Notice_ID)` as the primary key. |

**Relationship summary:** A department has many student and faculty profiles and many target rows. A user may have a student or faculty profile. A user may create many notices and approve many notices. A category has many notices. A notice has many target and attachment rows. Users bookmark notices through the composite-key `BOOKMARK` relation. A null target department or semester indicates an all-department or all-semester audience, respectively.

**Setup note:** The schema includes `USER.Is_Active` as a non-null Boolean defaulting to true, matching the runtime login and account-management queries. Sample user inserts use `TEMP_HASH_*` placeholder values, so those records are not usable as login credentials.

## 6. API summary

Protected routes use a bearer JWT. The route table in the root README lists all endpoints. Main API groups are:

- `/api/auth`: login.
- `/api/notices`: public published listing; submission; pending queue; approval/rejection; submitter history; form options; student-targeted notices.
- `/api/users`: administrator account listing, creation, activation, and deactivation.
- `/` and `/api/health`: welcome and database connectivity handlers. (The health handler is registered at `/api/health` in `server.js`.)

## 7. Security design

Passwords are bcrypt-hashed. SQL uses parameter placeholders for variable values. The authentication middleware verifies signed, expiring JWTs, and authorization checks protect administrative and review routes. Submission and review handlers apply department-specific restrictions. CORS is restricted to the local Vite origin. The frontend stores the JWT in local storage, and the repository does not configure rate limiting. Deployment should use HTTPS, strong private secrets, a production CORS allowlist, and a considered browser token-storage strategy.

## 8. Testing summary

The project owner stated that testing is complete and all functionality works. The referenced conversation specifically records successful role-based dashboards and a Faculty-to-HOD departmental approval flow. This is a manual-testing summary; the repository has no automated backend test suite, and its backend `test` script is a placeholder. Frontend lint and production build commands are available.

## 9. Cleanup performed

- Removed a database configuration `console.log` that printed whether connection fields were present.
- Removed the standalone Admin test endpoint and its now-unused middleware imports from the server.
- Moved `module.exports = router` to the end of `noticeRoutes.js`, after the student route.
- Verified `.gitignore` excludes `node_modules/` and `.env` files while allowing `.env.example`.
- No SQL schema, data, or workflow behavior was changed.
