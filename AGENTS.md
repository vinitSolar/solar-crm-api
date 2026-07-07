# SunSelect Solar India CRM

## Project Overview

SunSelect Solar India CRM is an enterprise-grade, multi-tenant SaaS CRM platform designed specifically for the solar industry.

The system manages the complete lifecycle of solar business operations including:

- Authentication & Authorization
- Multi-Tenant Management
- Customer Management
- Lead Management
- Sales Pipeline
- Quotations
- Site Survey
- Solar Project Management
- Installation Workflow
- Inventory Management
- Purchase Management
- Billing & Invoicing
- Payments
- Employee Management
- Attendance
- Tasks
- Notifications
- Reports
- Audit Logs
- Settings
- Dashboard

The project is designed to support large-scale deployments with high performance, scalability, maintainability, and clean architecture.

---

# Technology Stack

Backend

- Node.js
- Express.js
- TypeScript

Database

- PostgreSQL

Cache

- Redis

Background Jobs

- BullMQ

Storage

- Cloudflare R2 (S3 Compatible)

Authentication

- JWT
- Refresh Token

Validation

- Zod

Logging

- Winston

API Documentation

- Swagger / OpenAPI

Container

- Docker

Deployment

- Nginx

---

# Architecture

The application follows a Modular Monolith Architecture.

Future migration to Microservices should require minimal changes.

Current Architecture

Client
↓

Nginx
↓

Express API
↓

Services
↓

Repositories
↓

PostgreSQL

↓

Redis

↓

BullMQ Workers

Future Architecture

Gateway

↓

Auth Service

CRM Service

Notification Service

Billing Service

AI Service

Analytics Service

---

# Folder Structure

```
sunselect-crm/

apps/
    api/
        src/

            config/
            controllers/
            middlewares/
            modules/
            repositories/
            routes/
            services/
            utils/
            validators/
            types/

            app.ts
            server.ts

    worker/

    scheduler/

packages/

    logger/
    database/
    redis/
    queues/
    mail/
    storage/
    common/

docs/

scripts/

logs/

.env

package.json

tsconfig.json
```

---

# Module Structure

Every feature must follow this structure.

```
customer/

controller.ts

service.ts

repository.ts

routes.ts

validator.ts

dto.ts

types.ts

index.ts
```

Business logic MUST NEVER exist inside controllers.

Controllers should only:

- Validate request
- Call service
- Return response

---

# Repository Pattern

All database queries MUST be inside repositories.

Never write SQL inside controllers.

Never write SQL inside services.

Correct flow:

Controller

↓

Service

↓

Repository

↓

Database

---

# Service Layer

Services contain:

Business Logic

Validation Logic

Calculations

Workflow

Permission checks

No SQL queries inside services.

---

# Controllers

Controllers should remain thin.

Allowed:

- Request Validation
- Service Call
- Response

Not Allowed:

- SQL
- Business Logic
- Complex Calculations

---

# Logging

Use Winston only.

Never use:

console.log()

Instead:

logger.info()

logger.warn()

logger.error()

logger.debug()

Every important operation must be logged.

Examples

Authentication

Payment

Project Creation

Database Errors

Queue Jobs

Worker Execution

Cron Jobs

---

# Error Handling

Always use centralized error handling.

Never use:

try/catch in every controller.

Instead:

- Async Handler
- Custom Error Classes
- Global Error Middleware

---

# Validation

Use Zod.

Every request must be validated.

Never trust request.body.

---

# Authentication

JWT Authentication

Refresh Token

RBAC

Permission Based Access

Tenant Isolation

---

# Authorization

Every endpoint must verify:

Authentication

Permission

Tenant Access

Never expose another tenant's data.

---

# Database Rules

Use PostgreSQL.

Naming Convention

snake_case

Examples

customer_name

created_at

updated_at

deleted_at

Primary Key

id

Public ID

uuid

Soft Delete

deleted_at

Never permanently delete records unless necessary.

---

# API Rules

RESTful APIs only.

Naming

GET /customers
GET /customers/all (for unpaginated dropdowns)
POST /customers/list (for paginated lists with search/filters in body)
GET /customers/:id
POST /customers
PUT /customers/:id
DELETE /customers/:id

Never use:

/getCustomer
/addCustomer
/updateCustomer

Pagination API Rule:
- Always use POST /list (e.g. `/api/v1/customers/list`) for pagination instead of GET. 
- Pass `page`, `limit`, and `search` inside the JSON request body.
- Returns the standard paginated response structure (`{ success, message, data: [...], meta: { total, page, limit, totalPages } }`).
- For non-paginated lists (like dropdown data), use a dedicated GET /all endpoint (e.g. `/api/v1/customers/all`).
- When returning lists from `/all` endpoints, the array must be returned directly inside the `data` field (e.g., `"data": [...]`), without nesting it inside an object (e.g., NOT `"data": { "customers": [...] }`).

Soft Delete API Rule:
- For resources supporting soft delete, `/list` and `/all` endpoints must support an optional `status` filter (`active`, `deleted`, `all`).
- Pass `status` in the JSON request body for `POST /list`, and as a query parameter for `GET /all` (e.g. `?status=all`). Defaults to `active`.
- Implement a dedicated `PUT /:uid/restore` endpoint to restore soft-deleted records.
- Ensure the respective DTO/Safe types expose an `isDeleted` flag so API consumers can differentiate them when `status=all` is used.

---

# Responses

Standard Response

Success

{
    "success": true,
    "message": "",
    "data": {}
}

Error

{
    "success": false,
    "message": "",
    "errors": []
}

---

# Queue Rules

BullMQ

Every heavy task must be queued.

Examples

Email

SMS

WhatsApp

PDF Generation

Excel Export

Notifications

Image Processing

Never perform these tasks inside API requests.

---

# Redis Usage

Use Redis for

Caching

BullMQ

OTP

Rate Limiting

Temporary Data

Never use Redis as primary database.

---

# Storage

Files should be stored in Cloudflare R2.

Only URLs should be stored in PostgreSQL.

---

# Security

Always use

Helmet

CORS

Rate Limiter

Input Validation

Parameterized Queries

Password Hashing (bcrypt)

JWT Expiration

Refresh Tokens

Never expose stack traces in production.

---

# Coding Standards

Use TypeScript Strict Mode.

Avoid "any".

Prefer interfaces over types where appropriate.

Always use async/await.

Avoid nested callbacks.

Keep functions small.

Maximum function length:

50 lines

Maximum file length:

300 lines (prefer splitting earlier)

Extract all hardcoded strings (response messages, error messages, validation messages) into dedicated constant files (e.g., `constants/messages.ts` or similar) for every module.

---

# Naming Convention

Variables

camelCase

Functions

camelCase

Classes

PascalCase

Interfaces

Prefix with I

Enums

PascalCase

Constants

UPPER_SNAKE_CASE

Database

snake_case

---

# Code Principles

Follow

SOLID

DRY

KISS

Clean Code

Separation of Concerns

Single Responsibility Principle

Dependency Injection (future)

---

# Git Rules

Branch Naming

feature/login

feature/customer-module

fix/auth-token

hotfix/payment

Commit Style

feat:

fix:

refactor:

docs:

style:

test:

---

# Documentation

Every module must contain

Purpose

Endpoints

DTO

Database Tables

Business Rules

---

# Performance

Always

Pagination

Database Indexing

Caching

Lazy Loading

Compression

Avoid N+1 Queries

---

# AI Coding Rules

Whenever generating code:

- Follow the repository pattern.
- Keep controllers thin.
- Put business logic inside services.
- Put SQL only inside repositories.
- Never use console.log().
- Use Winston logger.
- Use Zod validation.
- Use TypeScript strict typing.
- Reuse existing utilities before creating new ones.
- Write scalable and production-ready code.
- Keep code modular.
- Avoid duplicate code.
- Follow project naming conventions.
- Ensure every new feature integrates cleanly into the existing architecture.
- Prefer maintainability over shortcuts.

---

# Project Goal

This project should be developed with enterprise software engineering practices and be capable of supporting thousands of concurrent users while remaining maintainable, secure, and scalable.