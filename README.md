# Vehicle Expense Tracker

## Overview

This project is a full-featured vehicle expense tracker with support for:
- Multi-currency and country-specific statistics
- Import/export of expenses, fuel, and income
- Comprehensive statistics and charts
- Full test coverage for all major features

## Quality Assurance

- **All tests pass:** 2488+ tests, 120+ test suites (as of latest run)
- **Lint:** No errors, only a single warning for an unused eslint-disable directive
- **CI/CD Ready:** All code is checked for lint and tested before deployment

## Test Coverage

- **Currency/Country-specific statistics:**
  - Fuel price trends, monthly fill-ups, and cost per KM are calculated and displayed by currency/country
  - All calculations and charts are tested for multi-currency correctness
  - **Edge cases covered:** missing/invalid currencies, zero/negative values, unknown currency codes
- **Import/Export:**
  - Import and export of expenses, fuel, and income are fully tested
  - API endpoints for all data types are covered by integration tests
  - **Edge cases covered:** empty data, malformed data, missing fields, very large responses
- **API:**
  - All REST endpoints are tested for CRUD operations, error handling, and authentication
  - **Edge cases covered:** network timeouts, malformed JSON, concurrent requests, large payloads
- **Frontend:**
  - All major pages/components have unit and integration tests
  - **Edge cases covered:** form validation with very long inputs, special characters, boundary values
- **Utilities:**
  - Date utilities, CSV export, API client, and validation functions are thoroughly tested
  - **Edge cases covered:** invalid dates, empty arrays/objects, boundary conditions

## How to Run Tests

```
npm test
```

## How to Run Lint

```
npm run lint
```

## How to Fix Lint Warnings

- The only warning is an unused eslint-disable directive in `app/lib/dbConnect.ts`. You can safely remove or ignore it.

## How to Contribute

- Please ensure all tests pass and lint is clean before submitting a PR.
- Add tests for any new features, especially for currency/country-specific logic and edge cases.
- Include edge case tests for error handling, boundary conditions, and malformed data.

---

For more details, see the `/docs` folder and in-code comments.