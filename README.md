# Material Estimate

**Material Estimate** is a lightweight, browser-based React application for entering, reviewing, and exporting material-estimate line items. It is designed as a focused starting point for estimators who need to capture manufacturer, part, pricing, markup, and labor details without a backend service.

> **Current status:** The application is an early client-side prototype. Records exist only in the active browser session and can be exported as JSON; they are not yet persisted or calculated automatically. The feature inventory below reflects the implementation in [`src/App.jsx`](./src/App.jsx).

## Contents

- [Capabilities](#capabilities)
- [Technology](#technology)
- [Getting started](#getting-started)
- [Using the application](#using-the-application)
- [Data behavior and current limitations](#data-behavior-and-current-limitations)
- [Project structure](#project-structure)
- [Quality checks](#quality-checks)
- [Enhancement plan](#enhancement-plan)
- [Contributing](#contributing)
- [License](#license)

## Capabilities

The current interface provides a single-page record-entry workflow. A user can capture an estimate line item, inspect the line items saved during the current session, remove an individual record, and download all current records as a JSON file.

| Area | Implemented behavior |
| --- | --- |
| Record entry | Captures quantity, manufacturer, part number, description, list price, multiplier, cost, total cost, markup, unit price, total price, and labor. |
| Record management | Adds submitted records to an in-memory list and supports deletion of individual records. |
| Review | Displays saved records with key fields, including quantity, part number, list price, cost, multiplier, markup, unit price, and total price. |
| Export | Creates a local `estimate_records.json` download containing the current records. |
| Responsiveness | Uses a responsive Tailwind layout that adapts the input grid across narrow and wide screens. |

## Technology

The project is a JavaScript single-page application built with React and Vite. It uses Tailwind CSS for styling, Radix-based UI primitives, and Lucide icons. The authoritative dependency and script definitions are in [`package.json`](./package.json).

| Layer | Selected technology | Purpose |
| --- | --- | --- |
| Application | React 19 | Component rendering and browser state management. |
| Build and local development | Vite 6 | Development server and production build. |
| Styling | Tailwind CSS 4 | Utility-first responsive styling. |
| UI components | Radix UI primitives | Accessible low-level UI building blocks. |
| Forms and validation libraries | React Hook Form and Zod | Available project dependencies for future validated form workflows. |
| Package manager | pnpm 10 | Reproducible dependency installation through `pnpm-lock.yaml`. |

## Getting started

### Prerequisites

Install a current Node.js LTS release and enable pnpm 10 or a compatible version. The project records its intended package-manager version in [`package.json`](./package.json).

### Install and run

Clone the repository, install the locked dependencies, and start Vite's development server.

```bash
git clone https://github.com/navigatingnc/material-estimate.git
cd material-estimate
pnpm install
pnpm dev
```

Vite prints the local URL in the terminal, typically `http://localhost:5173`. To create a production build, run:

```bash
pnpm build
```

To serve the built output locally for a final smoke check, run:

```bash
pnpm preview
```

## Using the application

Complete the record form and select **Add Record**. The application stores a snapshot of the form values in the visible Saved Records list. Select the delete control on a record to remove it from that list. When one or more records exist, select **Export JSON** to download all active-session records.

The current screen intentionally treats fields such as total cost, unit price, and total price as direct user inputs. It does not infer values from quantity, cost, markup, multiplier, or labor. This preserves the existing behavior while making the next development priorities explicit.

## Data behavior and current limitations

The application keeps record state in React memory and assigns a browser-generated timestamp ID when a record is saved. Export is performed entirely in the browser through a generated JSON data URI. Refreshing the page, closing the browser tab, or navigating away clears unsaved records.

| Topic | Current behavior | Implication |
| --- | --- | --- |
| Persistence | No local or server-side persistence. | Records must be exported before the session ends. |
| Validation | Form inputs accept values without required-field or business-rule validation. | Incomplete or inconsistent estimates can be saved. |
| Calculations | Totals and markup-related fields are manual. | The user is responsible for arithmetic accuracy. |
| Import | No import flow is available. | Exported JSON cannot yet be reloaded into the app. |
| Data schema | Records are raw form values with a timestamp-based ID. | Prices and quantities are stored as strings rather than normalized numeric values. |
| Testing | No automated test suite is currently configured. | Behavior changes need manual verification until tests are added. |
| Authentication and sharing | No accounts, roles, backend, or collaboration features are implemented. | The prototype is appropriate for individual, local use only. |

## Project structure

```text
material-estimate/
├── public/                 # Static files copied into the application build
├── src/
│   ├── App.jsx             # Estimator form, in-memory records, deletion, and JSON export
│   ├── App.css             # Application-level styles
│   ├── components/ui/      # Reusable UI primitives
│   ├── lib/                # Shared utilities
│   └── main.jsx            # React application entry point
├── package.json            # Scripts, dependencies, and package-manager declaration
├── pnpm-lock.yaml          # Locked dependency graph
└── vite.config.js          # Vite, React, Tailwind, and import-alias configuration
```

## Quality checks

The repository includes linting and production-build commands. Run both before opening a pull request.

```bash
pnpm lint
pnpm build
```

When modifying calculation rules, persistence, or import/export behavior, also perform a manual browser check that covers form entry, record deletion, export, page refresh behavior, and any changed arithmetic.

## Enhancement plan

The following plan is organized by user impact and implementation dependency. It is deliberately incremental so that the project can gain trustworthy core-estimation behavior before adding collaboration or integrations.

| Priority | Initiative | Scope and expected outcome | Completion criteria |
| --- | --- | --- | --- |
| P0 | Establish estimate calculations | Normalize monetary and quantity inputs; calculate total material cost, unit price, total price, margin, and labor extensions from documented formulas. Keep manual override behavior only where explicitly required. | Calculation logic is isolated, unit-tested, and produces consistent results for zero, decimal, discount, markup, and labor cases. |
| P0 | Add validation and input ergonomics | Define required fields, constrain numeric ranges, display inline errors, and format currency and percentages consistently. Reuse the installed React Hook Form and Zod dependencies where appropriate. | Invalid records cannot be saved; keyboard and screen-reader feedback is clear; all displayed currency is locale-formatted. |
| P0 | Persist safely in the browser | Add schema-versioned `localStorage` persistence with recovery from malformed saved data, plus a visible clear-data action. | Records survive a refresh and can be intentionally cleared; corrupted stored data does not break the application. |
| P1 | Improve estimate management | Add editing, duplicate line items, line-item search, sorting, filtering, and project-level grouping with subtotals and grand totals. | Users can create, revise, find, and summarize a multi-line estimate without exporting and re-entering data. |
| P1 | Support data interchange | Add JSON import with schema validation, CSV export, a documented stable record schema, and import-error feedback. | A valid exported file can be imported into a clean session without data loss; invalid files report actionable errors. |
| P1 | Build test coverage and delivery safeguards | Add unit tests for calculation and serialization functions, component tests for main workflows, and continuous integration that runs lint, tests, and build. | Pull requests fail automatically when quality checks fail and key estimator behavior is protected by tests. |
| P2 | Create polished estimate outputs | Add printable estimates and PDF/CSV deliverables with company, project, customer, terms, taxes, and presentation-ready totals. | A user can generate a consistent, print-ready estimate document from a selected project. |
| P2 | Add secure multi-user workflows | Introduce authenticated accounts, a backend data model, roles, audit history, and shareable projects only after a security and privacy design review. | Authorized users can collaborate on estimates with documented access controls and a tested migration path from browser-only data. |
| P3 | Add domain integrations | Evaluate supplier catalogs, price-book synchronization, and accounting/CRM integrations using a pluggable integration layer and provider-specific security review. | Each integration has clear data ownership, refresh behavior, error states, and operator documentation. |

### Recommended delivery sequence

Start by writing a small, documented calculation module and test cases before changing the form. Once validation and browser persistence are in place, add edit/import/export workflows around a stable data schema. Defer user accounts, integrations, and supplier pricing until the local estimation workflow is mathematically reliable, tested, and pleasant to use.

## Contributing

Contributions should focus on small, reviewable changes with a clear user outcome. Before submitting a pull request, describe the affected workflow, include tests when logic changes, run the quality checks, and update this README whenever installation, data behavior, or functionality changes.

For changes to formulas or data schema, include representative examples and describe any migration, backward-compatibility, or rounding decisions. Do not commit secrets, production exports containing customer data, or supplier credentials.

## License

No license file is currently included in this repository. Until a license is added by the project owner, contributors and users should not assume permissions beyond those granted by applicable law and the repository host's terms. The maintainer should select and add an explicit open-source license before accepting external contributions or distributing releases.

---

Maintained by the [`navigatingnc/material-estimate`](https://github.com/navigatingnc/material-estimate) project.
