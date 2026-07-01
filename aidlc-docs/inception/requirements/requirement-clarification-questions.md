# Requirements Clarification Questions

I detected a contradiction and an ambiguity in the previous answers that must be resolved before the requirements document can be finalized.

---

## Contradiction 1: Sensitive credential storage vs Security Baseline

You indicated file-based storage using AsyncStorage for app settings and login credentials in Question 5, but you also enabled the Security Baseline extension in Question 8.
These responses conflict because sensitive credentials require protected storage with encryption at rest, while AsyncStorage should be treated as non-sensitive application storage.

## Question 1: How should sensitive authentication data be stored on the device?

A) Store only non-sensitive settings in AsyncStorage, and store API secrets in platform secure storage (Keychain/Keystore or equivalent)
B) Encrypt authentication data before local persistence using a key backed by platform secure storage
C) Do not persist authentication data locally; require the user to re-enter it when needed
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Ambiguity 1: Exact authentication artifact

Question 6 selected API key based authentication, but Question 5 refers to login credentials. The exact secret type affects storage, UX, and security requirements.

## Question 2: What exact authentication data will the mobile app handle?

A) A Firefly III personal access token only
B) A Firefly III personal access token and the user-configured Firefly III server base URL
C) Username/password first, then exchange for or generate an API token for future requests
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

Please answer each question by filling in the letter choice after the [Answer]: tag. If none of the options match, choose X and describe your preferred approach.
