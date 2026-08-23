# Auth Specification

## Purpose

Authentication and configuration management for connecting to Firefly III server. Handles server URL configuration, personal access token storage, connectivity validation, and authentication state.

## Requirements

### Requirement: Server Configuration

The system SHALL allow users to configure a Firefly III server base URL and personal access token.

#### Scenario: Initial configuration (Mobile/Web)

- GIVEN the user opens the client for the first time
- WHEN the user enters a valid HTTPS URL and personal access token
- THEN the client validates the URL format and token presence
- AND the client tests connectivity against the Firefly III `/about` endpoint
- AND on success, the configuration is persisted and the user proceeds to the main app

#### Scenario: Initial configuration (CLI)

- GIVEN the user runs `luminescence configure` with no existing configuration
- WHEN the user provides server URL and token interactively or via flags
- THEN the client validates and tests connectivity
- AND on success, configuration is persisted to `~/.config/luminescence/config.json` (URL) and OS keyring (token)

#### Scenario: Invalid URL rejected

- GIVEN the user enters a non-HTTPS or malformed URL
- WHEN the user submits the configuration
- THEN the client rejects the input with a clear validation error
- AND no API call is made

#### Scenario: Empty token rejected

- GIVEN the user enters a valid URL but empty token
- WHEN the user submits the configuration
- THEN the client rejects with a validation error

### Requirement: Secure Token Storage

The system MUST store the personal access token only in platform-appropriate secure storage.

#### Scenario: Mobile token storage

- GIVEN a successful configuration on mobile
- WHEN the token is persisted
- THEN the token is stored in iOS Keychain or Android Keystore
- AND the token is never stored in AsyncStorage or any non-secure location

#### Scenario: Web token storage

- GIVEN a successful configuration on web
- WHEN the token is persisted
- THEN the token is stored in sessionStorage (cleared on tab close)
- AND the token is never stored in localStorage

#### Scenario: CLI token storage

- GIVEN a successful configuration on CLI
- WHEN the token is persisted
- THEN the token is stored in OS keyring via keytar
- AND the token is never stored in the JSON config file

### Requirement: Non-Sensitive Settings Storage

The system SHALL store the server base URL and other non-sensitive settings in platform-appropriate local storage.

#### Scenario: Mobile settings storage

- GIVEN a successful configuration on mobile
- WHEN the server URL is persisted
- THEN the URL is stored in AsyncStorage

#### Scenario: Web settings storage

- GIVEN a successful configuration on web
- WHEN the server URL is persisted
- THEN the URL is stored in localStorage

#### Scenario: CLI settings storage

- GIVEN a successful configuration on CLI
- WHEN the server URL is persisted
- THEN the URL is stored in `~/.config/luminescence/config.json`

### Requirement: Connectivity Validation

The system SHALL validate connectivity to the Firefly III server before persisting configuration.

#### Scenario: Successful connectivity check

- GIVEN valid server URL and token
- WHEN the user confirms configuration
- THEN the client calls the Firefly III `/about` endpoint
- AND on HTTP 200, configuration is persisted

#### Scenario: Failed connectivity check

- GIVEN invalid server URL or token
- WHEN the user confirms configuration
- THEN the client shows a user-friendly error (no stack traces, no token exposure)
- AND the user remains on the configuration screen

### Requirement: Configuration Persistence Across Sessions

The system SHALL preserve valid configuration between application launches.

#### Scenario: Mobile/Web reopen

- GIVEN a previously configured client
- WHEN the user reopens the application
- THEN the user is not prompted for configuration again
- AND the stored URL and token are used for API requests

#### Scenario: CLI reopen

- GIVEN a previously configured CLI
- WHEN the user runs any authenticated command
- THEN the client reads URL from config file and token from keyring
- AND proceeds without prompting

### Requirement: Configuration Update

The system SHALL allow users to update server URL or token with re-validation.

#### Scenario: Update server URL

- GIVEN an existing valid configuration
- WHEN the user updates the server URL
- THEN the client validates the new URL and re-tests connectivity
- AND on success, the new URL is persisted

#### Scenario: Update token

- GIVEN an existing valid configuration
- WHEN the user updates the personal access token
- THEN the client validates the new token and re-tests connectivity
- AND on success, the new token is persisted to secure storage

### Requirement: Fail-Closed on Missing/Invalid Configuration

The system MUST fail closed when configuration is missing, invalid, expired, or inaccessible.

#### Scenario: No configuration on authenticated operation

- GIVEN no valid configuration exists
- WHEN the user attempts any authenticated operation (Mobile/Web)
- THEN the client redirects to the configuration flow

#### Scenario: No configuration on CLI command

- GIVEN no valid configuration exists
- WHEN the user runs an authenticated CLI command
- THEN the CLI displays an error with instructions to run `luminescence configure`
- AND exits with non-zero code

#### Scenario: Token expired or invalid

- GIVEN a stored token that is expired or revoked
- WHEN the client attempts an API request
- THEN the client detects the auth failure
- AND prompts for re-authentication (Mobile/Web) or shows error with configure instructions (CLI)

### Requirement: Error Message Safety

The system SHALL never expose sensitive data in error messages.

#### Scenario: Network error

- GIVEN a network failure during API call
- WHEN the error is presented to the user
- THEN the message is generic (e.g., "Unable to connect to server")
- AND no stack traces, internal paths, or token values are exposed

#### Scenario: Authentication failure

- GIVEN an invalid or expired token
- WHEN the error is presented
- THEN the message indicates authentication failure without exposing the token value

### Requirement: TLS Enforcement

The system MUST enforce TLS 1.2 or higher for all Firefly III communication.

#### Scenario: HTTP URL rejected

- GIVEN the user enters an HTTP (non-HTTPS) URL
- WHEN the client validates the URL
- THEN the URL is rejected with a clear error message

#### Scenario: TLS version

- GIVEN an HTTPS connection to Firefly III
- WHEN the connection is established
- THEN TLS 1.2 or higher is used
- AND plaintext HTTP connections are never attempted
