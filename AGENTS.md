# Repository Guidelines

## Project Structure & Module Organization

This is a NestJS 11 TypeScript API. Application code lives in `src/`, with feature modules under `src/api/v1/` such as `auth`, `device`, `wallet`, `alchemy`, `banxa`, `moonpay`, `market-data`, and `notification`. Shared middleware, enums, interfaces, and utilities live in `src/common/`. Handlebars email templates are in `templates/`. E2E tests are in `test/`; unit tests sit beside source files as `*.spec.ts`. Security documentation is in `docs/security/`. Treat `dist/`, `coverage/`, and `node_modules/` as generated output.

## Build, Test, and Development Commands

- `yarn install`: install dependencies from `yarn.lock`.
- `yarn run start:dev`: run the Nest server in watch mode.
- `yarn run start`: run the server without watch mode.
- `yarn run build`: compile TypeScript into `dist/`.
- `yarn run start:prod`: run the compiled app from `dist/main`.
- `yarn run test`: run Jest unit tests under `src/`.
- `yarn run test:e2e`: run E2E tests using `test/jest-e2e.json`.
- `yarn run test:cov`: generate Jest coverage.
- `yarn run lint`: run ESLint with auto-fix.
- `yarn run format`: format `src/**/*.ts` and `test/**/*.ts` with Prettier.

## Coding Style & Naming Conventions

Use TypeScript with NestJS module boundaries: controllers handle HTTP concerns, services hold business logic, repositories isolate persistence, DTOs validate inputs, and schemas define MongoDB models. Follow existing names like `*.controller.ts`, `*.service.ts`, `*.module.ts`, `*.repository.ts`, `dto/*.dto.ts`, and `schema/*.schema.ts`. Use two-space indentation, single quotes, trailing commas where Prettier adds them, and dependency injection through constructors.

## Testing Guidelines

Jest is configured in `package.json` with `rootDir: "src"` and `testRegex: ".*\\.spec\\.ts$"`. Keep unit tests beside the implementation, for example `wallet.service.spec.ts`. Put cross-module HTTP tests in `test/*.e2e-spec.ts`. Add or update tests for authorization, DTO validation, provider integrations, and repository behavior when changing those paths.

## Commit & Pull Request Guidelines

Recent history uses short, descriptive subjects such as `added banxa`, `wallet sync`, and `PR fixes`. Keep commit subjects concise and action-oriented, preferably under 72 characters. Pull requests should include a summary, test results, linked issue or task, configuration changes, and any security impact. For API changes, mention affected routes and sample request/response changes.

## Security & Configuration Tips

Do not commit `.env` files, API keys, Firebase service-account files, JWT secrets, provider secrets, or database credentials. Runtime configuration is loaded from environment variables and AWS SSM in `start.sh`. When touching auth, wallet, webhook, notification, or provider code, review `docs/security/` and avoid logging OTPs, tokens, wallet addresses, signed URLs, or raw provider payloads.
