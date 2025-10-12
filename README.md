# Coinect

## Table of Contents
1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started Locally](#getting-started-locally)
4. [Available Scripts](#available-scripts)
5. [Project Scope](#project-scope)
6. [Project Status](#project-status)
7. [License](#license)

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

| Category      | Technology                                                              |
|---------------|-------------------------------------------------------------------------|
| **Frontend**  | [Astro](https://astro.build/) 5, [React](https://react.dev/) 19, [TypeScript](https://www.typescriptlang.org/) 5, [Tailwind CSS](https://tailwindcss.com/) 4, [Shadcn/ui](https://ui.shadcn.com/) |
| **Backend**   | [Supabase](https://supabase.com/) (PostgreSQL, Authentication, BaaS SDK)  |
| **AI**        | [Openrouter.ai](https://openrouter.ai/) for access to various AI models     |
| **DevOps**    | [GitHub Actions](https://github.com/features/actions) for CI/CD, [DigitalOcean](https://www.digitalocean.com/) for hosting |

## Getting Started Locally

To set up and run the project on your local machine, follow these steps.

### Prerequisites
- **Node.js**: `v22.14.0` (as specified in the `.nvmrc` file). We recommend using a version manager like `nvm`.
- **npm**: Comes bundled with Node.js.

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
    Create a `.env` file in the root of the project by copying the example file:
    ```bash
    cp .env.example .env
    ```
    You will need to populate this file with your credentials for services like Supabase and Openrouter.ai.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Available Scripts

The following scripts are available in the `package.json`:

-   `npm run dev`: Starts the development server with hot-reloading.
-   `npm run build`: Builds the application for production.
-   `npm run preview`: Serves the production build locally for previewing.
-   `npm run lint`: Lints the codebase for errors and style issues.
-   `npm run lint:fix`: Automatically fixes linting issues.
-   `npm run format`: Formats the code using Prettier.

## Project Scope

The project is being developed in phases. The scope for the Minimum Viable Product (MVP) is defined below.

### In Scope (MVP)
-   User Authentication and Authorization
-   Client and Invoice Management
-   Bulk Time Entry and Tracking
-   PDF Invoice Generation
-   Basic AI-driven insights from private notes
-   User Onboarding and In-app Notifications

### Out of Scope (Post-MVP)
-   Advanced analytics dashboards and custom reports.
-   Direct integrations with third-party time trackers (e.g., Jira, ClickUp).
-   Team collaboration features (e.g., multi-user accounts, roles).
-   Advanced invoicing features like recurring invoices, pro-formas, and corrections.

## Project Status

**Current Status:** In Development

This project is currently in the **MVP development phase**. It is not yet ready for production use. The focus is on implementing the core features outlined in the project scope.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
