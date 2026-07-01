# Requirements Clarification Questions

Please answer the following questions to help define the requirements for this project.
Fill in the letter choice (and any additional description) after each `[Answer]:` tag.

---

## Question 1: Project Overview

What is the primary purpose of this project?

A) Web API / Backend service
B) Web frontend / UI application
C) Full-stack web application (frontend + backend)
D) CLI tool / Command-line utility
E) Library / SDK / Framework
F) Mobile application
G) Data pipeline / ETL tool
X) Other (please describe after [Answer]: tag below)

[Answer]: F

---

## Question 2: Programming Language

What programming language(s) should be used?

A) Go
B) TypeScript / JavaScript (Node.js)
C) Python
D) Rust
E) Swift / Kotlin (mobile)
F) Multiple languages (please describe)
X) Other (please describe after [Answer]: tag below)

[Answer]: B - Full TypeScript (React Native for Mobile Application)

---

## Question 3: Target Users

Who are the primary users or consumers of this system?

A) End users (general public)
B) Internal team / developers
C) Other systems / services (machine-to-machine)
D) Both end users and developers
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4: Core Features

What are the main features or capabilities you want to build? (Please describe freely)

[Answer]: Mobile client application for Firefly-iii API to manage personal finances, including transaction tracking, account management, expense categorization, and financial reporting.

---

## Question 5: Data Storage

Does the project require persistent data storage?

A) Yes — relational database (e.g., PostgreSQL, MySQL)
B) Yes — NoSQL database (e.g., MongoDB, DynamoDB)
C) Yes — file-based storage
D) No — stateless / in-memory only
E) Not decided yet
X) Other (please describe after [Answer]: tag below)

[Answer]: C - File-based storage (AsyncStorage for app settings and login credentials)

---

## Question 6: Authentication / Authorization

Does the project require user authentication or access control?

A) Yes — standard username/password authentication
B) Yes — OAuth2 / OpenID Connect (social login or SSO)
C) Yes — API key based
D) No — no authentication needed
E) Not decided yet
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 7: Deployment Environment

Where will this project be deployed or run?

A) Cloud (AWS, GCP, Azure)
B) Self-hosted / on-premise server
C) Container / Kubernetes
D) Serverless
E) Local machine only
F) Not decided yet
X) Other (please describe after [Answer]: tag below)

[Answer]: X - Mobile devices (iOS/Android via app stores)

---

## Question 8: Security Extension

Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints
(recommended for production-grade applications)
B) No — skip all SECURITY rules
(suitable for PoCs, prototypes, and experimental projects)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 9: Property-Based Testing Extension

Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints
(recommended for projects with business logic, data transformations,
serialization, or stateful components)
B) Partial — enforce PBT rules only for pure functions and serialization
round-trips (suitable for limited algorithmic complexity)
C) No — skip all PBT rules
(suitable for simple CRUD applications, UI-only projects,
or thin integration layers with no significant business logic)
X) Other (please describe after [Answer]: tag below)

[Answer]: B
