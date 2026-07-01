# Scope Expansion Questions

The current requirements baseline focuses on a mobile client. The following questions clarify how Web and CLI should be added to the project scope.

---

## Question 1: Delivery Scope

Should Web and CLI be included in the initial delivery, or scheduled after the mobile client?

A) Include Mobile, Web, and CLI in the initial delivery
B) Deliver Mobile first, then Web and CLI later
C) Deliver Mobile and Web first, then CLI later
D) Deliver Mobile and CLI first, then Web later
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2: Feature Parity

Should all clients share the same functional scope?

A) Yes, all clients should aim for feature parity
B) No, Web and CLI may expose a reduced feature set
C) No, each platform may have platform-specific features
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3: Web Target

What should the Web client target?

A) Browser-based responsive web application
B) Desktop-first web application
C) Administrative or technical web console
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4: CLI Target

What should the CLI target?

A) Interactive terminal application for human users
B) Scriptable command-line utility for automation
C) Both interactive and scriptable usage
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 5: Authentication Storage

How should authentication data be stored on Web and CLI?

A) Web uses session-only storage; CLI uses OS keyring or equivalent secure storage
B) Web persists tokens only in browser-appropriate secure storage; CLI uses OS keyring or equivalent secure storage
C) Do not persist authentication locally on Web or CLI
D) Other (please describe after [Answer]: tag below)

[Answer]: A
