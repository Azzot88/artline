
.PHONY: test test-unit test-integration test-e2e test-enforcement test-frontend lint format clean

# Variables
PYTHON_CMD=python3
PYTEST_CMD=pytest
NPM_CMD=npm --prefix frontend

test: test-unit test-integration test-frontend test-enforcement

test-unit:
	$(PYTEST_CMD) -m unit

test-integration:
	$(PYTEST_CMD) -m integration

test-e2e:
	$(PYTEST_CMD) -m e2e

test-enforcement:
	$(PYTHON_CMD) -m tests.enforcement.arch_check
	$(PYTHON_CMD) -m tests.enforcement.security_check

test-frontend:
	$(NPM_CMD) run test

test-coverage:
	$(PYTEST_CMD) --cov=app --cov-report=term-missing --cov-report=html
	$(NPM_CMD) run coverage

lint:
	flake8 app tests
	$(NPM_CMD) run lint

format:
	black app tests
	$(NPM_CMD) run format

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".coverage" -delete
	rm -rf htmlcov
