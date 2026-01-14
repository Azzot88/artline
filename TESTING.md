# Testing Strategy & Guide

This project maintains a comprehensive test suite following the 2026 Gold Standard architecture.

## Directory Structure

```
tests/
├── unit/           # Fast, isolated tests (no DB/Network)
├── integration/    # Tests engaging DB, API, or external services
├── e2e/            # Full system tests
├── enforcement/    # Scripts to enforce architecture/security
└── conftest.py     # Pytest fixtures
```

## Running Tests

We use `make` to orchestrate tests.

### Backend

- **All Tests**: `make test`
- **Unit Tests**: `make test-unit`
- **Integration Tests**: `make test-integration`
- **Enforcement**: `make test-enforcement`

### Frontend

- **All Components**: `make test-frontend` (Runs `npm run test` in frontend dir)

### Coverage

- Generate report: `make test-coverage`

## Writing Tests

### Backend (Pytest)

1. **Unit Tests**: Mark with `@pytest.mark.unit`. Do not use `db_session` fixture.
2. **Integration**: Mark with `@pytest.mark.integration`. Use `db_session` or `client` fixtures.
3. **Async**: Use `@pytest.mark.asyncio` for async functions.

**Example:**
```python
@pytest.mark.unit
def test_logic():
    assert 1 + 1 == 2
```

### Frontend (Vitest)

Tests are located alongside code or in `src/test`. Files usually end in `.test.tsx` or `.spec.ts`.

**Example:**
```tsx
import { render, screen } from "@testing-library/react";
import MyComponent from "./MyComponent";

test("renders correctly", () => {
  render(<MyComponent />);
  expect(screen.getByText("Hello")).toBeInTheDocument();
});
```

## CI/CD

Tests run automatically on PRs via GitHub Actions (`.github/workflows/ci.yml`).
