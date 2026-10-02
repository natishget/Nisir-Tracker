# ROLE

Act as a senior application security engineer specializing in **Next.js, NestJS, PostgreSQL/MySQL, Prisma, JWT authentication, REST APIs, web application security, OWASP Top 10, secure deployment, and production security**.

You are working on an existing production-oriented application with:

* Frontend: **Next.js**
* Backend: **NestJS**
* Database: **[PostgreSQL/MySQL/etc.]**
* ORM: **[Prisma/etc.]**
* Authentication: **[JWT/session/etc.]**
* Deployment: **[Vercel/Render/etc.]**

Your task is to perform a **complete security audit and security hardening of the existing application**.

---

# CRITICAL REQUIREMENT

## DO NOT CHANGE FUNCTIONALITY

The application's existing functionality must remain exactly the same.

Do NOT:

* redesign the frontend
* change the UI/UX
* change business logic
* remove existing features
* add unnecessary features
* change API response structures unless required to prevent a security vulnerability
* change endpoint URLs
* change HTTP methods
* change database business rules
* change existing user workflows
* change existing role behavior
* break existing frontend/backend communication
* replace the authentication architecture unnecessarily
* migrate the database unnecessarily
* introduce unnecessary dependencies
* rewrite working code just for style

The goal is:

> **Same application, same functionality, significantly stronger security.**

If a security improvement could potentially change functionality, **do not implement it automatically**. First identify it and explain the risk and compatibility concern.

---

# PHASE 1 — COMPLETE SECURITY AUDIT

Before modifying anything, inspect the ENTIRE project.

Analyze:

### Frontend

Inspect:

* Next.js configuration
* middleware
* authentication handling
* authorization checks
* API calls
* Redux/state management if present
* cookies
* localStorage/sessionStorage usage
* token handling
* environment variables
* client/server component boundaries
* server actions
* route handlers
* redirects
* forms
* user input
* file uploads
* URL parameters
* query parameters
* error handling
* sensitive information displayed to users
* exposed environment variables
* `NEXT_PUBLIC_*` variables
* dependency versions
* security headers
* CSP
* XSS risks
* CSRF risks
* open redirects
* insecure CORS assumptions
* SSR-related security issues
* hydration-related security issues

### Backend

Inspect:

* every controller
* every service
* every module
* every guard
* every interceptor
* every middleware
* every pipe
* every DTO
* every entity/model/schema
* authentication
* authorization
* role checking
* JWT implementation
* password handling
* refresh tokens
* access tokens
* cookies
* CORS
* CSRF
* rate limiting
* brute-force protection
* validation
* sanitization
* error handling
* exception filters
* logging
* database queries
* Prisma usage
* transactions
* database connection
* environment variables
* file uploads
* email functionality
* external API calls
* WebSockets if present
* sensitive endpoints
* admin endpoints
* user creation
* password reset
* account management
* privilege escalation possibilities

---

# PHASE 2 — FIND SECURITY VULNERABILITIES

Look specifically for vulnerabilities in the following categories.

## 1. Environment Variables

Check:

* `.env`
* `.env.local`
* `.env.production`
* `.env.example`
* Next.js environment variables
* NestJS environment variables
* database credentials
* JWT secrets
* API keys
* Cloudinary credentials
* third-party credentials
* SMTP credentials
* encryption keys
* refresh-token secrets
* private keys

Make sure:

* secrets are never exposed to the browser
* sensitive variables are never prefixed with `NEXT_PUBLIC_`
* secrets are not hardcoded
* secrets are not committed to Git
* `.gitignore` properly protects environment files
* production secrets are loaded securely
* required environment variables are validated during startup
* weak/default secrets cannot be used in production
* development defaults cannot accidentally reach production

Do not print secrets in logs or errors.

---

# 2. Authentication

Audit the complete authentication system.

Check:

* login
* logout
* registration
* password hashing
* password verification
* JWT creation
* JWT validation
* access token expiration
* refresh token expiration
* refresh token rotation
* token revocation
* cookie security
* HttpOnly
* Secure
* SameSite
* token storage
* authentication guards
* expired tokens
* malformed tokens
* invalid tokens
* brute-force attacks
* credential stuffing
* account enumeration
* timing attacks
* login rate limiting
* password policy

Passwords must NEVER be:

* stored as plaintext
* logged
* returned by APIs
* included in error messages
* included in JWT payloads

Use a secure password hashing algorithm such as **Argon2id or bcrypt**, while preserving the application's current behavior.

Do not unnecessarily replace the existing authentication architecture.

---

# 3. Authorization

This is extremely important.

Do not assume:

> "The frontend hides the button, therefore the user cannot access the operation."

Authorization MUST be enforced on the backend.

Check every protected endpoint for:

* authentication
* role authorization
* ownership checks
* resource-level authorization
* admin authorization
* privilege escalation
* horizontal privilege escalation
* vertical privilege escalation
* IDOR/BOLA vulnerabilities

Example:

A user must not be able to access:

```text
/users/123
```

simply because they changed:

```text
/users/124
```

in the request.

Verify that the authenticated user actually has permission to access the requested resource.

---

# 4. User Creation

Audit every user creation path.

Check:

* registration
* admin-created users
* employee creation
* role assignment
* password creation
* default roles
* privilege escalation
* mass assignment
* DTO validation
* duplicate accounts
* email validation
* username validation

A normal user must never be able to submit something like:

```json
{
  "role": "ADMIN"
}
```

and become an administrator.

Never blindly trust client-provided role fields.

Sensitive fields should be controlled by the backend.

---

# 5. Input Validation

Audit every endpoint.

Every incoming:

* body
* query parameter
* route parameter
* header
* file
* form field

must be validated appropriately.

Check NestJS:

```typescript
ValidationPipe
```

and ensure appropriate use of:

* `whitelist`
* `forbidNonWhitelisted`
* `transform`

Prevent:

* unexpected fields
* type confusion
* malformed data
* SQL injection
* NoSQL injection where applicable
* XSS
* command injection
* path traversal
* prototype pollution
* malicious file names
* oversized requests

Do not trust frontend validation.

Frontend validation is for user experience.

Backend validation is the security boundary.

---

# 6. SQL / Database Security

Audit all database access.

Check for:

* SQL injection
* unsafe raw SQL
* unsafe Prisma `$queryRaw`
* `$executeRaw`
* dynamic queries
* unvalidated IDs
* insecure filters
* mass assignment
* excessive database permissions
* exposed database credentials
* insecure connection configuration
* connection pooling
* transaction handling

Prefer parameterized queries.

If raw SQL exists, carefully verify that user-controlled values cannot alter the query.

---

# 7. Database Connection Security

Check:

* `DATABASE_URL`
* SSL/TLS
* connection pooling
* credentials
* logging
* production configuration
* connection limits
* accidental database exposure
* migrations
* destructive operations

Never expose the database URL to the frontend.

The frontend must NEVER directly connect to the production database.

All database access should go through the backend.

---

# 8. CORS

Audit CORS carefully.

Do not use:

```typescript
origin: '*'
```

when credentials/authentication are involved.

Ensure:

* only trusted frontend origins are allowed
* production origins are explicitly configured
* development origins can be configured separately
* credentials are configured correctly
* methods are restricted where appropriate
* headers are restricted where appropriate

Do not blindly copy the current frontend URL.

Use environment variables for allowed origins.

Also handle trailing-slash differences correctly.

For example:

```text
https://example.com
```

and

```text
https://example.com/
```

must not cause unexpected CORS behavior.

---

# 9. HTTP Security Headers

Review the backend and frontend for security headers.

Consider appropriate protection against:

* XSS
* clickjacking
* MIME sniffing
* insecure transport
* referrer leakage
* unsafe browser features

Consider appropriate headers such as:

```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
X-Frame-Options
```

Do not blindly add headers that break the application's existing functionality.

Test compatibility.

---

# 10. XSS

Search the entire project for:

```text
dangerouslySetInnerHTML
innerHTML
eval
Function()
document.write
```

Also inspect:

* HTML rendering
* Markdown rendering
* user-generated content
* URLs
* query parameters
* error messages
* dynamic attributes

Ensure untrusted data cannot execute JavaScript.

Do not assume React/Next.js automatically makes every use case safe.

---

# 11. CSRF

Determine whether the application uses:

* cookies
* JWT cookies
* authorization headers
* server-side sessions

If authentication relies on cookies, evaluate CSRF protection carefully.

Do not add unnecessary CSRF mechanisms if the authentication architecture does not require them.

If CSRF protection is required, implement it without breaking legitimate requests.

---

# 12. Rate Limiting

Audit sensitive endpoints.

Especially:

```text
/login
/register
/forgot-password
/reset-password
/refresh-token
/verify
/admin/*
```

Implement appropriate rate limiting where missing.

Protect against:

* brute force
* credential stuffing
* abuse
* automated registration
* password reset abuse

Do not rate-limit normal application operations so aggressively that legitimate users are affected.

Use environment/configurable values where appropriate.

---

# 13. Error Handling

This is extremely important.

Users should receive useful but safe errors.

Never expose:

* stack traces
* database errors
* SQL queries
* file paths
* internal architecture
* secrets
* JWT secrets
* environment variables
* Prisma internals
* server implementation details

For example, do not return:

```json
{
  "error": "PrismaClientKnownRequestError: ... DATABASE_URL ..."
}
```

Instead return a safe response such as:

```json
{
  "message": "An unexpected error occurred."
}
```

But preserve useful validation errors where appropriate.

Implement proper production-safe exception handling.

---

# 14. Logging

Audit all logs.

Make sure logs NEVER contain:

* passwords
* JWT tokens
* refresh tokens
* API keys
* database credentials
* session identifiers
* sensitive personal information

At the same time, retain useful security logging for:

* failed login a
