# Luminescence

> [!IMPORTANT]
> This project is under development.

## 🎉 Features

- **🔧 Modular Design**: Each component is encapsulated in its own package, making it easy to reuse and maintain.
- **⚡️ TypeScript Support**: Full type safety and modern JavaScript features.
- **🧪 Testing Framework**: Integrated with Vitest for unit and integration testing.
- **⚙️ Configuration Management**: Centralized configuration using environment variables and configuration files.
- **🔌 Extensible Architecture**: Designed to be extended with additional modules and plugins.

## 🚀 Getting Started

### 📋 Prerequisites

- Node.js (v18 or later)
- pnpm (v8 or later)

### 📦 Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/makinosp/luminescence.git
    cd luminescence
    ```

2. Install dependencies:
    ```bash
    pnpm install
    ```

### ▶️ Running the Application

To start the development server:

```bash
pnpm run dev
```

To run tests:

```bash
pnpm test
```

## 🏗️ Architecture

### 🧩 Core Components

- **📦 Domain Models**: Represent the business entities and logic.
- **🧑‍💼 Service Layer**: Provides business logic and orchestrates operations.
- **🗄️ Infrastructure**: Handles external integrations, such as databases and APIs.

### 🧑‍💼 Service Layer

Services are implemented as TypeScript classes that encapsulate specific business functionalities. Each service interacts with domain models and infrastructure components to perform its tasks.

### 💾 Data Storage

Luminescence uses a combination of in-memory stores and persistent databases. The storage layer abstracts the underlying implementation details, providing a consistent interface for data access.

## 🧪 Testing

The project uses Vitest as its testing framework. Tests are located in the `packages/*/src/__tests__` directories and can be run with the following command:

```bash
pnpm test
```

## 📄 License

This project is licensed under the BSD-3 License - see the [LICENSE](LICENSE) file for details.
