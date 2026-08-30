# Architecture Overview

## Summary

This project is designed as an App Service-first Azure repository.

## Layers
- infra/terraform: infrastructure as code
- .github: repository operations, CI/CD, validation
- docs: architecture and runbooks

## Deployment model

- Dev workflow deploys to the development environment
- Prod workflow deploys to the production environment
- Azure resources are managed declaratively through Bicep

<!-- AI/LLM に関する運用は現在このプロジェクトでは使用していません。 -->

