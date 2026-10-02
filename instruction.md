# TASK MANAGEMENT & ORGANIZATIONAL REPORTING SYSTEM

## Full-Stack Development Specification

You are acting as a senior full-stack software engineer, software architect, UX designer, security engineer, and database designer.

Your job is to develop a complete, production-ready, company-specific **Task Management and Organizational Reporting System**.

The application must be:

* Very simple
* Very clear
* Extremely user-friendly
* Fast
* Secure
* Professional
* Easy to learn
* Easy to maintain
* Appropriate for users who are not highly technology-oriented
* Designed around the company's actual organizational hierarchy
* Focused on task management, accountability, and simple reporting

Do NOT build a complicated Jira/Trello-style application.

The target users are employees who use computers and smartphones but are not necessarily young or highly technology-oriented. The application must therefore prioritize **clarity and simplicity over feature density**.

---

# 1. EXISTING PROJECT STRUCTURE

The project root already contains:

```text
project-root/
│
├── server/
│   └── NestJS application already initialized
│
└── client/
    └── Next.js application already initialized
```

The NestJS application is already set up inside:

```text
/server
```

The Next.js application is already set up inside:

```text
/client
```

The PostgreSQL database URL is already available inside:

```text
/server/.env
```

Do NOT create a new NestJS project.

Do NOT create a new Next.js project.

Do NOT replace the existing project structure.

First inspect the existing applications and understand their current configuration before making changes.

Preserve working functionality.

---

# 2. TECHNOLOGY STACK

## Frontend

Use:

* Next.js
* TypeScript
* React
* Tailwind CSS
* shadcn/ui where appropriate
* React Hook Form where useful
* Zod for validation
* Redux Toolkit / RTK Query or another clean centralized API state solution if already configured
* Responsive design

Do not introduce unnecessary frontend libraries.

Prefer simple, maintainable solutions.

---

# Backend

Use:

* NestJS
* TypeScript
* Prisma ORM
* PostgreSQL
* REST API
* JWT authentication
* Secure password hashing
* Role-based and permission-based authorization
* Validation
* Proper exception handling
* Audit logging

Use NestJS modules properly.

Do not put business logic inside controllers.

---

# 3. DATABASE

Use PostgreSQL with Prisma ORM.

The database connection already exists in:

```text
server/.env
```

Use:

```env
DATABASE_URL=...
```

Do not hard-code database credentials anywhere.

Create a clean Prisma schema.

Use proper:

* Foreign keys
* Relations
* Indexes
* Unique constraints
* Nullable fields where appropriate
* Created/updated timestamps
* Soft deletion where appropriate

Use Prisma migrations.

Do not use destructive database operations unless explicitly necessary.

---

# 4. SECURITY IS A HIGH PRIORITY

Treat security as a core requirement, not an afterthought.

## NEVER hard-code:

* Database credentials
* JWT secrets
* Encryption keys
* API keys
* SMTP credentials
* Third-party credentials
* Cloud credentials
* Internal secrets
* Production URLs that should be configurable
* Sensitive configuration

Everything sensitive or environment-specific must be stored in `.env`.

Provide:

```text
server/.env.example
client/.env.example
```

with placeholder values only.

Never commit real secrets.

---

# 5. ENVIRONMENT VARIABLES

Use environment variables for everything that should be configurable.

For example:

```env
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=
CLIENT_URL=
SERVER_URL=
NODE_ENV=
```

If another secret/configuration becomes necessary, add it to `.env`.

Never create secrets directly in source code.

The frontend must only receive variables that are explicitly safe to expose.

Never expose:

```text
DATABASE_URL
JWT_SECRET
PRIVATE_KEYS
SERVER_SECRETS
```

through the Next.js client.

---

# 6. ORGANIZATIONAL STRUCTURE

The company structure is:

```text
CEO
│
├── Strategy and Brand
├── HR
├── IT
├── Risk and Compliance
├── Finance and Investment
├── Audit
├── Resource and Partnership
├── Channel and Customer Experience
├── Credit
└── Legal
```

Some directorates have units.

For example:

```text
Strategy and Brand
│
├── Strategy Unit
└── Brand Unit
```

Other directorates may:

* Have multiple units
* Have one unit
* Have no units
* Have a manager without a formal unit
* Have staff directly under the directorate

Therefore:

## IMPORTANT

Do NOT hard-code the assumption that every directorate has a unit.

Units must be optional.

Do NOT hard-code the organizational hierarchy into the application.

The administrator must be able to configure:

* Directorates
* Units
* Positions
* Employees
* Managers
* Reporting relationships

---

# 7. ORGANIZATION MODEL

The application should support:

```text
Organization
    ↓
Directorate
    ↓
Unit (optional)
    ↓
Employee
```

Employees may have positions such as:

```text
Director
Manager
Senior
Officer
Junior
Graduate Trainee
```

But do NOT make these positions hard-coded.

The administrator should be able to create/edit positions.

---

# 8. SYSTEM ROLES

Separate organizational positions from application permissions.

For example:

```text
SYSTEM ADMIN
CEO
DIRECTOR
MANAGER
STAFF
```

These are application-level roles.

An employee's organizational position is separate.

Example:

```text
Position:
Senior Strategy Officer

System Role:
STAFF
```

Use RBAC/permissions properly.

Permissions should control things such as:

```text
CREATE_TASK
EDIT_TASK
ASSIGN_TASK
VIEW_OWN_TASKS
VIEW_TEAM_TASKS
VIEW_DIRECTORATE_TASKS
REVIEW_TASK
SUBMIT_REPORT
REVIEW_REPORT
APPROVE_REPORT
MANAGE_USERS
MANAGE_ORGANIZATION
VIEW_AUDIT_LOG
```

Do not rely only on hiding buttons in the frontend.

Every sensitive permission must also be enforced on the backend.

---

# 9. AUTHENTICATION

Implement secure authentication.

Users should log in using:

```text
Username / Email
Password
```

Use:

* Secure password hashing
* JWT access token
* Refresh token
* Secure token handling
* Token expiration
* Proper logout
* Backend authorization guards
* Rate limiting on authentication endpoints
* Account protection against brute-force attempts

Prefer HttpOnly secure cookies for authentication tokens where appropriate.

Do not store sensitive authentication secrets in localStorage.

Implement:

```text
Login
Logout
Refresh session
Current user
Change password
Forgot/reset password
```

if appropriate for the existing infrastructure.

---

# 10. TASK MANAGEMENT IS THE CORE FEATURE

The task system must be extremely simple.

A normal employee should be able to understand the task screen without training.

A task should support:

```text
Title
Description
Created By
Assigned To
Directorate
Unit
Priority
Status
Start Date
Due Date
Progress
Comments
Attachments
Created Date
Updated Date
Completed Date
```

Use clear terminology.

Avoid technical terminology.

---

# 11. TASK STATUS

Use a simple workflow:

```text
TO DO
IN PROGRESS
BLOCKED
SUBMITTED
COMPLETED
CANCELLED
```

Explain statuses clearly in the UI.

For example:

```text
To Do
Not started yet

In Progress
Currently working on it

Blocked
Cannot continue because something is preventing progress

Submitted
Employee says the work is finished and ready for review

Completed
Manager/reviewer confirmed completion

Cancelled
Task is no longer required
```

Do not overwhelm users with many statuses.

---

# 12. TASK OWNERSHIP

Support:

```text
Task Owner
Collaborators
Reviewer
```

The primary task owner is responsible for the task.

Managers/directors may assign tasks.

Employees may also create their own tasks.

The system should support both:

### Self-created task

```text
Employee
    ↓
Creates task
    ↓
Works on task
    ↓
Submits task
```

### Manager-assigned task

```text
Manager
    ↓
Creates task
    ↓
Assigns employee
    ↓
Employee works
    ↓
Employee submits
    ↓
Manager reviews
    ↓
Completed
```

---

# 13. TASK PROGRESS

Allow simple progress tracking:

```text
0%
25%
50%
75%
100%
```

or a slider.

Do not make progress unnecessarily complicated.

Keep progress history so the system can record changes.

Example:

```text
September 20 — 25%
September 22 — 50%
September 24 — 75%
September 25 — 100%
```

---

# 14. TASK PRIORITY

Use:

```text
Low
Normal
High
Critical
```

Do not allow users to abuse "Critical".

Critical tasks should be visually clear but not visually aggressive.

---

# 15. TASK DEADLINES

Tasks must clearly display:

```text
Due Today
Due Tomorrow
Due This Week
Overdue
Completed
```

Use human-friendly wording.

Example:

```text
Due today
```

instead of making the user interpret a complicated timestamp.

---

# 16. TASK ACTIVITY HISTORY

Every important task action should be recorded.

Example:

```text
Task created by Manager

Assigned to John

Due date changed

Progress changed from 50% to 75%

Comment added

Attachment uploaded

Task submitted

Task approved
```

This should be visible as a simple activity timeline.

This also contributes to the audit trail.

---

# 17. COMMENTS

Allow users to communicate directly inside a task.

Example:

```text
Manager:
Please update the financial figures.

Employee:
Updated the figures and attached the revised file.
```

Keep comments simple.

Do not create a complicated chat system.

---

# 18. ATTACHMENTS

Allow users to attach relevant documents to tasks.

Security requirements:

* Validate file types
* Validate file size
* Do not execute uploaded files
* Do not trust client-side validation
* Validate everything on the backend
* Use secure filenames
* Prevent path traversal
* Store files outside the application source code
* Never expose private files publicly without authorization

Make attachment functionality modular so storage can later be changed to cloud storage if needed.

---

# 19. RECURRING TASKS

Support recurring tasks.

Examples:

```text
Daily
Weekly
Monthly
Quarterly
Yearly
```

Example:

```text
Monthly Social Media Report
Every month
Assigned to Brand Unit
```

The system should automatically create the next task instance.

Keep the UI simple.

---

# 20. MY TASKS

The employee's main page should be:

# My Tasks

Show:

```text
Today
Overdue
Upcoming
Completed
```

Example:

```text
MY TASKS

Due Today
────────────────────
Prepare monthly report       High
Review campaign design       Normal

Overdue
────────────────────
Update branch information    High

Upcoming
────────────────────
Prepare October plan         Normal
```

The user should immediately understand what needs attention.

---

# 21. EMPLOYEE DASHBOARD

Keep the dashboard simple.

Do NOT fill it with dozens of charts.

Show approximately:

```text
Good morning, [Name]

My Tasks

[ 5 ] To Do
[ 3 ] In Progress
[ 1 ] Blocked
[ 8 ] Completed

Today's Tasks

Upcoming Deadlines

Recent Activity
```

The dashboard should answer:

> What do I need to do?

within a few seconds.

---

# 22. MANAGER DASHBOARD

Managers should see their team.

Example:

```text
My Team

8 Employees

Tasks
12 To Do
9 In Progress
2 Blocked
21 Completed
3 Overdue
```

Then:

```text
Team Members

Employee        Tasks      Status
John            8          On Track
Sarah           6          2 overdue
Michael         7          On Track
```

Allow the manager to click into an employee.

---

# 23. DIRECTOR DASHBOARD

The director should see their entire directorate.

Example:

```text
Strategy and Brand

Total Tasks: 48
Completed: 32
In Progress: 10
Blocked: 3
Overdue: 3
```

Then show units if they exist:

```text
Strategy Unit
Brand Unit
```

If there are no units, show employees/managers directly.

Do not break if a directorate has no unit.

---

# 24. CEO DASHBOARD

The CEO dashboard must be a high-level summary.

Do NOT show hundreds of individual tasks by default.

Show:

```text
Company Overview

Total Tasks
Completed
In Progress
Blocked
Overdue
```

Then:

```text
Directorates

Strategy & Brand
HR
IT
Risk & Compliance
Finance & Investment
Audit
Resource & Partnership
Channel & Customer Experience
Credit
Legal
```

Each directorate should have a simple summary.

The CEO can drill down when necessary.

---

# 25. REPORTING SYSTEM

Reporting is one of the most important parts of the application.

Reports should be generated from actual task data.

Do NOT force employees to manually rewrite all of their tasks into a report.

The system should automatically calculate:

```text
Tasks completed
Tasks in progress
Blocked tasks
Overdue tasks
Upcoming tasks
Progress
```

Then allow the employee/manager/director to add a short narrative.

---

# 26. DAILY REPORT

A daily report should be simple.

Example:

```text
DAILY WORK REPORT

Employee:
Date:

Completed Today
3 tasks

In Progress
2 tasks

Blocked
1 task

Additional Notes
[Short text box]

Challenges
[Short text box]

Submit Report
```

Most information should be automatically generated.

---

# 27. WEEKLY REPORT

Weekly report:

```text
WEEKLY REPORT

Period:
September 21 - September 27

Completed: 14
In Progress: 6
Blocked: 2
Overdue: 1

Key Completed Work

[Automatically generated tasks]

Challenges

[Short text]

Next Week

[Short text]

Submit
```

---

# 28. MONTHLY REPORT

Monthly reports should follow the same philosophy.

```text
MONTHLY REPORT

September 2026

Completed Tasks
In Progress
Blocked
Overdue

Major Achievements

Challenges

Important Pending Work

Next Month Priorities
```

Keep it short.

---

# 29. REPORTING HIERARCHY

Reports should move upward.

```text
Employee
    ↓
Manager
    ↓
Director
    ↓
CEO
```

The system should automatically aggregate lower-level data.

For example:

```text
Employees
    ↓
Unit Report
    ↓
Directorate Report
    ↓
Company Report
```

Managers and directors should primarily review, explain, and validate the data instead of manually copying it.

---

# 30. REPORT STATUS

Reports should have:

```text
DRAFT
SUBMITTED
REVIEWED
APPROVED
LOCKED
```

Example:

```text
Employee
    ↓
Submit
    ↓
Manager Review
    ↓
Director Review
    ↓
CEO / Company Report
    ↓
Locked
```

Historical reports should not silently change.

Maintain an audit trail for corrections.

---

# 31. REPORT COMMENTS

Managers should be able to add:

```text
Manager Comments
```

Directors:

```text
Director Comments
```

CEO:

```text
Executive Comments
```

Keep these separate from task data.

---

# 32. ORGANIZATIONAL MANAGEMENT

Create an administration section.

Admin should be able to manage:

```text
Users
Directorates
Units
Positions
System Roles
Permissions
Reporting Relationships
```

Example:

```text
Directorates

Strategy and Brand
HR
IT
Risk and Compliance
Finance and Investment
Audit
Resource and Partnership
Channel and Customer Experience
Credit
Legal
```

The administrator should be able to add future directorates without changing code.

---

# 33. MANAGER RELATIONSHIPS

Do not assume every employee reports directly to a manager.

Support:

```text
Employee → Manager
Manager → Director
Director → CEO
```

But allow exceptions where organizational structure requires them.

The reporting relationship should be configurable.

---

# 34. SEARCH

Provide simple global search.

Users should be able to search tasks by:

```text
Task name
Employee
Directorate
Unit
Status
Priority
```

Managers/directors should only see information they have permission to access.

---

# 35. FILTERS

Use simple filters.

Example:

```text
Status
Priority
Employee
Directorate
Unit
Due Date
```

Do not create a complicated filter builder in the first version.

---

# 36. NOTIFICATIONS

Notifications should be useful, not annoying.

Notify users for important events:

```text
New task assigned
Task due soon
Task overdue
Task blocked
Task submitted
Task reviewed
Manager comment
Report submitted
Report returned
```

Users should have a notification center.

---

# 37. AUDIT LOG

Maintain a secure audit log for important system actions.

Record:

```text
Who
What
When
Target
Previous value
New value
IP address where appropriate
```

Examples:

```text
User created
User disabled
Task assigned
Task deleted
Task status changed
Report approved
Permission changed
Organization structure changed
```

Audit logs should be accessible only to authorized administrators.

---

# 38. USER EXPERIENCE REQUIREMENTS

This is extremely important.

The users are not necessarily young or highly technology-oriented.

Therefore:

## DO

Use:

* Large readable text
* Clear buttons
* Simple menus
* Familiar words
* Consistent layouts
* Clear labels
* Helpful empty states
* Confirmation messages
* Clear success/error messages
* Simple forms
* Logical navigation
* Responsive layouts
* Accessible contrast
* Adequate spacing

## DO NOT

Do not use:

* Excessive animations
* Complicated dashboards
* Tiny icons without labels
* Technical terminology
* Excessive colors
* Huge numbers of cards
* Hidden functionality
* Complicated navigation
* Unnecessary modals
* Excessive charts
* "Gen Z" design patterns
* Overly futuristic UI

The application should feel:

**Professional + Calm + Familiar + Modern + Simple**

Not:

**Gaming + flashy + futuristic + complicated.**

---

# 39. DESIGN LANGUAGE

Use a professional enterprise interface.

Prefer:

```text
White / light neutral background
Dark readable text
One primary brand color
Subtle secondary colors
Clear status colors
```

Use color meaning consistently:

```text
Green → Completed
Yellow/Orange → Attention
Red → Overdue/Critical
Blue → Informational/In Progress
Gray → Neutral
```

Do not use color as the only way of communicating status.

Always include text/icons.

---

# 40. NAVIGATION

Keep the sidebar simple.

For STAFF:

```text
Dashboard
My Tasks
Calendar
Reports
Notifications
Profile
```

For MANAGER:

```text
Dashboard
My Tasks
Team Tasks
Team
Reports
Calendar
Notifications
Profile
```

For DIRECTOR:

```text
Dashboard
My Tasks
Directorate
Reports
Objectives
Calendar
Notifications
Profile
```

For CEO:

```text
Dashboard
Directorates
Reports
Objectives
Critical Tasks
Profile
```

For ADMIN:

```text
Dashboard
Users
Organization
Roles & Permissions
Tasks
Reports
Audit Logs
Settings
```

Do not show irrelevant menu items.

---

# 41. RESPONSIVE DESIGN

The application must work well on:

```text
Desktop
Laptop
Tablet
Mobile
```

However, desktop should receive special attention because many employees will use computers.

On mobile:

* Avoid wide tables
* Use cards
* Keep forms short
* Use large touch targets
* Make task actions easy

---

# 42. ACCESSIBILITY

Follow good accessibility practices.

Use:

* Semantic HTML
* Proper labels
* Keyboard navigation
* Accessible dialogs
* Accessible buttons
* Sufficient contrast
* Focus states
* Screen-reader-friendly labels

Do not rely entirely on icons.

---

# 43. API ARCHITECTURE

Organize NestJS into clear modules.

Suggested structure:

```text
server/src/

├── auth/
├── users/
├── organization/
│   ├── directorates/
│   ├── units/
│   ├── positions/
│   └── reporting-lines/
├── tasks/
│   ├── dto/
│   ├── entities/
│   └── ...
├── reports/
├── notifications/
├── audit/
├── files/
├── permissions/
├── prisma/
└── common/
```

Use proper:

```text
Controllers
Services
DTOs
Guards
Decorators
Pipes
Repositories where appropriate
```

Do not put everything into `app.module.ts`.

---

# 44. FRONTEND STRUCTURE

Use a clean structure such as:

```text
client/

├── app/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── tasks/
│   ├── reports/
│   ├── dashboard/
│   └── organization/
├── lib/
├── hooks/
├── services/
├── store/
├── types/
└── validations/
```

Follow the existing Next.js architecture if one already exists.

Do not unnecessarily restructure the existing application.

---

# 45. VALIDATION

Use Zod on the frontend where appropriate.

Use NestJS validation pipes and DTO validation on the backend.

Never trust frontend validation.

Every API endpoint must validate input on the backend.

Handle:

```text
Missing fields
Invalid IDs
Invalid dates
Unauthorized access
Forbidden access
Invalid status transitions
Invalid file uploads
Duplicate records
```

with clear errors.

---

# 46. ERROR HANDLING

Users should never see raw errors such as:

```text
PrismaClientKnownRequestError...
```

Instead:

```text
Something went wrong while saving the task.

Please try again.
```

Developers should still have useful server-side logs.

---

# 47. DATABASE DESIGN PRINCIPLES

Use normalized relational data.

Avoid storing organizational structures as JSON when relational tables are more appropriate.

Avoid duplicated user information.

Use foreign keys.

Add indexes to frequently queried fields such as:

```text
userId
directorateId
unitId
assignedTo
status
dueDate
createdAt
```

Use transactions for operations that modify multiple related records.

---

# 48. IMPORTANT SECURITY RULES

Implement:

* Authentication guards
* Authorization guards
* Role checks
* Permission checks
* Ownership checks
* Directorate/team scope checks
* Input validation
* Rate limiting
* Secure password hashing
* Secure cookies
* CORS configuration
* Helmet/security headers where appropriate
* SQL injection protection through Prisma
* File upload validation
* Audit logging
* Secure error handling

Never trust:

```text
userId
role
directorateId
unitId
```

sent from the client.

Determine authorization from the authenticated server-side user.

---

# 49. DATA ACCESS RULE

This is critical.

A user must not be able to access another department's data simply by changing an ID in the URL.

For example:

```text
/tasks/123
```

must verify that the authenticated user has permission to view task `123`.

The backend must enforce organizational scope.

Examples:

```text
STAFF → Own tasks
MANAGER → Own team
DIRECTOR → Own directorate
CEO → Entire organization
ADMIN → Configuration and authorized system data
```

Never rely on frontend filtering for security.

---

# 50. SOFT DELETE

For important business records, prefer soft deletion where appropriate.

Do not permanently delete:

* Historical reports
* Audit logs
* Important task history

unless there is a specific administrative process.

---

# 51. SEED DATA

Create a development seed script with:

```text
CEO

Directorates:
Strategy and Brand
HR
IT
Risk and Compliance
Finance and Investment
Audit
Resource and Partnership
Channel and Customer Experience
Credit
Legal

Units:
Strategy Unit
Brand Unit
```

Create sample users for testing:

```text
Admin
CEO
Director
Manager
Staff
```

Use clearly fake development credentials.

Never place production credentials in seed files.

---

# 52. TESTING

Implement meaningful tests.

At minimum test:

## Backend

* Authentication
* Authorization
* Task creation
* Task assignment
* Task access control
* Status changes
* Report submission
* Report approval
* Organization permissions

## Frontend

Test critical user flows:

```text
Login
Create task
Assign task
Complete task
Submit report
Manager reviews report
Director reviews report
```

Do not waste time creating tests for trivial UI styling.

---

# 53. PERFORMANCE

Keep the application fast.

Avoid:

* Unnecessary API calls
* Huge database queries
* Fetching all tasks when only a page is needed
* N+1 queries
* Rendering thousands of records at once

Use:

```text
Pagination
Filtering
Sorting
Server-side querying
Database indexes
Caching only when necessary
```

---

# 54. DON'T OVERENGINEER

This is extremely important.

Do not add features just because they sound impressive.

Do NOT initially add:

* AI task generation
* AI employee scoring
* Complex gamification
* Social feeds
* Chat application
* Video conferencing
* Complex workflow designer
* Microservices
* Event-driven architecture everywhere
* Unnecessary external services

Keep the architecture clean and modular.

A well-designed modular monolith is preferred for this application.

---

# 55. REAL-TIME FEATURES

Real-time updates are useful but should be limited to appropriate areas.

If Socket.IO is used, use it for:

```text
New task assignment
Task status changes
Notifications
Report submission notifications
Important dashboard updates
```

Do not make every API operation dependent on WebSockets.

REST APIs remain the primary communication mechanism.

---

# 56. REPORT EXPORT

Prepare the architecture so reports can later be exported to:

```text
PDF
Excel
```

Do not make complex export functionality the first priority unless necessary.

---

# 57. USER FLOW EXAMPLE

A normal employee should be able to do this:

```text
Login
 ↓
Dashboard
 ↓
My Tasks
 ↓
Create Task
 ↓
Enter title
 ↓
Enter due date
 ↓
Save
 ↓
Work on task
 ↓
Update progress
 ↓
Mark as Submitted
 ↓
Manager reviews
 ↓
Completed
```

This should feel extremely easy.

---

# 58. MANAGER FLOW

```text
Login
 ↓
Dashboard
 ↓
See team status
 ↓
Assign task
 ↓
Select employee
 ↓
Set deadline
 ↓
Save
 ↓
Employee receives notification
 ↓
Employee completes task
 ↓
Manager reviews
 ↓
Approve
```

---

# 59. REPORT FLOW

```text
Employee tasks
      ↓
System automatically generates report data
      ↓
Employee adds notes
      ↓
Submit
      ↓
Manager reviews
      ↓
Manager adds comments
      ↓
Director reviews consolidated information
      ↓
CEO sees company summary
```

---

# 60. DEVELOPMENT PROCESS

Before writing large amounts of code:

### STEP 1

Inspect the existing:

```text
/server
/client
```

projects.

Understand:

* Existing dependencies
* Existing modules
* Existing pages
* Existing configuration
* Existing environment variables
* Existing database setup

### STEP 2

Design the Prisma schema.

### STEP 3

Create migrations.

### STEP 4

Implement authentication and authorization.

### STEP 5

Implement organization management.

### STEP 6

Implement task management.

### STEP 7

Implement dashboards.

### STEP 8

Implement reports.

### STEP 9

Implement notifications.

### STEP 10

Implement audit logs.

### STEP 11

Improve UX and accessibility.

### STEP 12

Test the complete system.

---

# 61. IMPORTANT DEVELOPMENT RULE

Do not generate a large amount of code blindly.

Work feature by feature.

After implementing each major feature:

1. Check TypeScript errors.
2. Check Prisma schema.
3. Run migrations.
4. Run backend tests.
5. Run frontend checks.
6. Fix errors.
7. Verify the feature.
8. Then move to the next feature.

Do not leave broken imports, placeholder functions, TODO implementations, or fake API responses.

---

# 62. DO NOT DESTROY EXISTING WORK

Before changing an existing file:

* Read it first.
* Understand it.
* Preserve useful existing code.
* Modify only what is necessary.

Do not rewrite the entire project simply because another architecture is preferred.

---

# 63. FINAL QUALITY STANDARD

Before considering the project complete, verify:

### Authentication

* Login works
* Logout works
* Refresh works
* Unauthorized users are blocked

### Authorization

* Staff cannot access another team's private data
* Managers can access their teams
* Directors can access their directorates
* CEO can access company-level data
* Admin can manage configuration

### Tasks

* Create
* Assign
* Edit
* Update progress
* Comment
* Submit
* Review
* Complete
* Cancel
* Track history

### Reports

* Daily
* Weekly
* Monthly
* Employee
* Manager
* Directorate
* Company

### Organization

* Directorates
* Optional units
* Employees
* Managers
* Reporting relationships

### Security

* No hard-coded secrets
* Environment variables
* Secure authentication
* Backend authorization
* Validation
* Audit logs
* Secure file handling

### UX

* Simple
* Clear
* Responsive
* Accessible
* Professional
* Easy for non-technical users

---

# 64. MOST IMPORTANT PRODUCT PRINCIPLE

Always ask:

> "Can an employee who is not highly technology-oriented understand what to do on this screen without someone explaining it?"

If the answer is no, simplify the screen.

The application should feel like:

**"I open the system and immediately know what I need to do."**

Not:

**"I need to learn how this software works."**

Build a serious enterprise system underneath, but keep the experience extremely simple on top.

Start by inspecting the existing `server` and `client` projects and then implement the system systematically according to this specification.
