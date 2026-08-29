SHELL := /bin/bash

.PHONY: validate lint help bootstrap

help:
	@echo "Available targets:"
	@echo "  validate  - repository validation"
	@echo "  lint      - basic static checks"
	@echo "  bootstrap - initialize common tooling"

bootstrap:
	@chmod +x .github/scripts/*.sh
	@echo "Project scaffold initialized."

validate:
	@bash .github/scripts/validate-repo.sh

lint:
	@bash .github/scripts/lint.sh
