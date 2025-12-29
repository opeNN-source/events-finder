SHELL:=/usr/bin/env bash

.PHONY: format
format:
	uv run ruff format
	uv run ruff check

.PHONY: lint
lint:
	uv run ruff check --exit-non-zero-on-fix
	uv run ruff format --check --diff
	uv run flake8 .
	uv run mypy wemake_python_styleguide scripts
	uv run lint-imports
	uv run python3 scripts/check_generic_visit.py wemake_python_styleguide/visitors/ast
