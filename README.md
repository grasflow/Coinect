# Coinect

## Table of Contents

1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started Locally](#getting-started-locally)
4. [Available Scripts](#available-scripts)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Project Scope](#project-scope)
7. [Project Status](#project-status)
8. [License](#license)

## Project Description

Coinect is a web application designed for freelancers who work with multiple clients. It automates the invoicing process and analyzes work patterns to help optimize rates and save time. The primary goal is to streamline administrative tasks by aggregating time tracking data from various sources and generating professional invoices automatically.

### Key Features

- **Bulk Time Entry**: Aggregate work hours from different time-tracking systems in one place.
- **Automated Invoice Generation**: Create professional PDF invoices with a single click.
- **AI-Powered Insights**: Analyze private work notes to identify patterns of undervalued work, such as overtime, scope creep, and rush jobs.
- **Multi-Currency Support**: Handle invoicing in different currencies (PLN, EUR, USD) with automatic exchange rate fetching from the National Bank of Poland (NBP).
- **Full Editability**: Modify generated invoices as needed, with a clear audit trail of changes.

## Tech Stack

The project leverages a modern tech stack to deliver a fast, reliable, and user-friendly experience.

| Category             | Technology                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**         | [Astro](https://astro.build/) 5, [React](https://react.dev/) 19, [TypeScript](https://www.typescriptlang.org/) 5, [Tailwind CSS](https://tailwindcss.com/) 4, [Shadcn/ui](https://ui.shadcn.com/) |
| **Backend**          | [Supabase](https://supabase.com/) (PostgreSQL, Authentication, BaaS SDK)                                                                                                                          |
| **AI**               | [Openrouter.ai](https://openrouter.ai/) for access to various AI models                                                                                                                           |
| **Testing (Unit)**   | [Vitest](https://vitest.dev/) 2.0+, [@testing-library/react](https://testing-library.com/react), [MSW](https://mswjs.io/) 2.0                                                                     |
| **Testing (E2E)**    | [Playwright](https://playwright.dev/), [axe-playwright](https://github.com/abhinaba-ghosh/axe-playwright), [Percy/Chromatic](https://percy.io/)                                                   |
| **Testing (Others)** | [k6](https://k6.io/) (performance), [Snyk](https://snyk.io/) (security), [Pact.io](https://pact.io/) (contract testing)                                                                           |
| **DevOps**           | [GitHub Actions](https://github.com/features/actions) for CI/CD, [DigitalOcean](https://www.digitalocean.com/) for hosting                                                                        |

## Getting Started Locally

To set up and run the project on your local machine, follow these steps.

### Prerequisites

- **Node.js**: `v22.14.0` (as specified in the `.nvmrc` file). We recommend using a version manager like `nvm`.
- **npm**: Comes bundled with Node.js.
- **Supabase CLI**: For running Supabase locally. Install via:
  ```bash
  brew install supabase/tap/supabase
  ```
  Or follow [official installation guide](https://supabase.com/docs/guides/cli/getting-started)
- **Docker Desktop**: Required by Supabase CLI to run local database

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/coinect.git
    cd coinect
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    **Dla rozwoju lokalnego:**
    Skopiuj `.env.example` do `.env` i uzupełnij wartości:

    ```bash
    cp .env.example .env
    ```

    **Dla testów:**
    Skopiuj `env.test.example` do `env.test` i uzupełnij wartości:

    ```bash
    cp env.test.example env.test
    ```

    Przykładowa zawartość `.env`:

    ```bash
    # Supabase Local Development (domyślne klucze dla localhost)
    PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
    PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
    SUPABASE_URL=http://127.0.0.1:54321
    SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

    # OpenRouter API (opcjonalne - tylko dla AI features)
    OPENROUTER_API_KEY=your_openrouter_api_key_here
    ```

4.  **Start Supabase locally:**

    ```bash
    supabase start
    ```

    Ta komenda:
    - Uruchomi lokalną bazę PostgreSQL
    - Zastosuje wszystkie migracje z `supabase/migrations/`
    - Udostępni lokalne API pod `http://127.0.0.1:54321`

    Po uruchomieniu zobaczysz URLs i klucze API (te same co w `.env`).

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

### Useful Supabase Commands

- `supabase start` - Uruchom lokalną instancję Supabase
- `supabase stop` - Zatrzymaj lokalną instancję
- `supabase status` - Sprawdź status i URLs
- `supabase db reset` - Zresetuj bazę danych (usuwa wszystkie dane i aplikuje migracje od nowa)
- `supabase studio` - Otwórz Supabase Studio w przeglądarce (lokalne GUI do zarządzania bazą)

## Available Scripts

The following scripts are available in the `package.json`:

### Development

- `npm run dev`: Starts the development server with hot-reloading.
- `npm run dev:test`: Starts the dev server with test environment variables.
- `npm run build`: Builds the application for production.
- `npm run preview`: Serves the production build locally for previewing.

### Code Quality

- `npm run lint`: Lints the codebase for errors and style issues.
- `npm run lint:fix`: Automatically fixes linting issues.
- `npm run format`: Formats the code using Prettier.

### Testing

- `npm run test`: Runs unit tests in watch mode.
- `npm run test:run`: Runs all unit tests once.
- `npm run test:coverage`: Runs tests with coverage report.
- `npm run test:e2e`: Runs E2E tests with Playwright.
- `npm run test:e2e:ui`: Opens Playwright UI for debugging.
- `npm run test:all`: Runs all tests (unit + E2E).

## CI/CD Pipeline

Projekt wykorzystuje GitHub Actions do automatycznego testowania i budowania kodu.

### Automatyczne uruchamianie

Pipeline uruchamia się automatycznie przy każdym push do brancha `master`.

### Manualne uruchamianie

1. Przejdź do zakładki **Actions** w repozytorium
2. Wybierz workflow **CI Pipeline**
3. Kliknij **Run workflow**

### Etapy pipeline

```
Push to master → Lint → Unit Tests + E2E Tests → Build Production
```

### Szczegóły

- **Lint**: ESLint sprawdzenie kodu (~1 min)
- **Unit Tests**: Vitest z coverage 70% (~2 min)
- **E2E Tests**: Playwright testy end-to-end (~3-5 min)
- **Build**: Produkcyjny build Astro (~2 min)

📚 **Pełna dokumentacja**: Zobacz pliki w katalogu `.github/workflows/`:

- `README.md` - Wymagane sekrety i konfiguracja
- `SETUP.md` - Instrukcja konfiguracji krok po kroku
- `CHECKLIST.md` - Checklist przed pierwszym uruchomieniem
- `ARCHITECTURE.md` - Szczegółowa architektura pipeline

## Project Scope

The project is being developed in phases. The scope for the Minimum Viable Product (MVP) is defined below.

### In Scope (MVP)

- User Authentication and Authorization
- Client and Invoice Management
- Bulk Time Entry and Tracking
- PDF Invoice Generation
- Basic AI-driven insights from private notes

### Out of Scope (Post-MVP)

- Advanced analytics dashboards and custom reports.
- Direct integrations with third-party time trackers (e.g., Jira, ClickUp).
- Team collaboration features (e.g., multi-user accounts, roles).
- Advanced invoicing features like recurring invoices, pro-formas, and corrections.

## Project Status

**Current Status:** In Development

This project is currently in the **MVP development phase**. It is not yet ready for production use. The focus is on implementing the core features outlined in the project scope.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
