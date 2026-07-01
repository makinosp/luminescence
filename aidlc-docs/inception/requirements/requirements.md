# Requirements

## Intent Analysis Summary

- User Request: Build a TypeScript-based client suite for the Firefly III API to manage personal finances across mobile, web, and CLI interfaces, including transaction tracking, account management, expense categorization, and financial reporting.
- Request Type: New Project
- Scope Estimate: Multiple client applications with shared core logic
- Complexity Estimate: High
- Requirements Depth: Comprehensive

## Product Goal

The product shall be a multi-client application suite for iOS, Android, web browsers, and CLI environments that connects to an existing Firefly III server and enables end users to manage personal finance data from supported client interfaces.

## Primary User Scenario

1. A user opens the client they want to use on a supported device, browser, or terminal.
2. The user enters a Firefly III server base URL and a personal access token.
3. The client validates connectivity and persists configuration using platform-appropriate storage.
4. The user accesses transaction, account, category, and reporting data through the Firefly III API.

## Functional Requirements

- FR-01: The system shall provide client applications targeting iOS, Android, web browsers, and CLI environments.
- FR-02: The system shall be implemented with a TypeScript-based multi-client stack that supports shared core logic across mobile, web, and CLI clients.
- FR-03: The system shall allow the user to configure a Firefly III server base URL from any client.
- FR-04: The system shall allow the user to provide a Firefly III personal access token for authenticated API access from any client.
- FR-05: The system shall use the personal access token and the configured server base URL as the only authentication artifacts handled by the clients.
- FR-06: The system shall store non-sensitive application settings and the configured server base URL in platform-appropriate non-sensitive local persistence.
- FR-07: The system shall store the personal access token only in platform-appropriate authentication storage, using mobile secure storage, session-only browser storage, and OS keyring or equivalent CLI storage as applicable.
- FR-08: The system shall require a configured server base URL and personal access token before allowing authenticated Firefly III operations from any client.
- FR-09: The system shall retrieve and manage personal finance data relevant to transaction tracking through the Firefly III API.
- FR-10: The system shall retrieve and manage account information exposed by the Firefly III API.
- FR-11: The system shall retrieve and manage expense categorization data exposed by the Firefly III API.
- FR-12: The system shall present financial reporting views based on data retrieved from the Firefly III API.
- FR-13: The system shall preserve non-sensitive local configuration between application launches, subject to each platform's storage model.
- FR-14: The system shall provide explicit user feedback for invalid server configuration, authentication failure, and network or API failure states.
- FR-15: The system shall provide a common core feature set across the mobile, web, and CLI clients, subject to platform-specific interaction constraints.
- FR-16: The web client shall provide a browser-based responsive user interface suitable for modern desktop and mobile browsers.
- FR-17: The CLI client shall support both interactive terminal workflows and scriptable command-line usage.

## Non-Functional Requirements

- NFR-01: All communication with the Firefly III server shall use TLS 1.2 or higher; plaintext HTTP connections are out of scope for the current baseline.
- NFR-02: The personal access token shall never be stored in AsyncStorage or any other non-secure local store.
- NFR-03: Secrets, tokens, and other sensitive user data shall never be hardcoded, logged, or displayed in diagnostic output.
- NFR-04: User-facing error messages shall be generic and shall not expose stack traces, framework details, internal paths, or token values.
- NFR-05: Application logging shall be structured enough to capture timestamp, log level, and message, and any remote log export shall use an approved centralized service with sensitive fields redacted.
- NFR-06: Security-critical logic shall be isolated into dedicated modules for authentication, API access, secure credential storage, and local settings management.
- NFR-07: Authenticated operations shall fail closed when configuration is missing, invalid, expired, or inaccessible from secure storage.
- NFR-08: The solution shall use current supported runtime and framework versions, committed lock files, and pinned dependencies suitable for reproducible builds.
- NFR-09: Build and test instructions shall include dependency vulnerability scanning.
- NFR-10: Critical user flows shall be covered by example-based automated tests.
- NFR-11: Pure transformation logic and serialization or deserialization round-trips shall be covered by property-based tests.
- NFR-12: The TypeScript test stack shall use fast-check for property-based testing where applicable.
- NFR-13: Property-based test failures shall preserve reproducibility data such as seeds and minimized counterexamples.

## Constraints and Assumptions

- CA-01: This is a greenfield project.
- CA-02: The backend system is an existing Firefly III deployment operated outside this project.
- CA-03: The project scope includes mobile, web, and CLI clients and does not include backend, infrastructure, or Firefly III server changes.
- CA-04: Username and password login flows, token exchange flows, and server-side authorization changes are out of scope unless explicitly approved later.
- CA-05: Offline-first synchronization, push notifications, and multi-user collaboration are not included in the current baseline requirements.
- CA-06: No separate application database is required at this stage; local persistence is limited to client-side settings and authentication artifacts stored using platform-appropriate mechanisms.
- CA-07: The mobile, web, and CLI clients shall provide the same core Firefly III feature set, subject to platform-specific UI and storage constraints.

## Extension-Derived Requirements

### Security Baseline

- SB-01: Non-sensitive settings may use platform-appropriate local settings stores.
- SB-02: The Firefly III personal access token shall use platform-appropriate authentication storage only, with mobile secure storage, session-only browser storage, and OS keyring or equivalent CLI storage as applicable.
- SB-03: Client-side validation shall reject malformed server URLs and other invalid user inputs before request submission.
- SB-04: Logging and diagnostics shall redact secrets and other sensitive data.
- SB-05: The implementation shall use defense in depth through validation, secure storage, and fail-closed error handling.

### Property-Based Testing (Partial Enforcement)

- PBT-REQ-01: Property-based testing applies to pure domain logic and serialization round-trips only.
- PBT-REQ-02: Property generators shall model realistic domain constraints rather than unconstrained primitive data.
- PBT-REQ-03: Property-based tests shall complement, not replace, example-based tests for critical user flows.

## Deferred Decisions for Later Stages

- DD-01: Exact screen architecture, user navigation flows, and CLI command UX.
- DD-02: The precise set of reporting views and financial KPIs.
- DD-03: State management, navigation, networking library, and shared client architecture selection.
- DD-04: Mobile secure storage library selection, web session storage approach, and CLI keyring library selection.
- DD-05: CI platform and specific dependency vulnerability scanner selection.
