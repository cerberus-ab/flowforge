# Agent Instructions

## Overview

FlowForge is a Web Onboarding Assistant that provides contextual UI guidance in
web applications. It is an npm workspace project with a browser extension,
backend, and shared packages.

## Precedence

`AGENTS.md` is the canonical shared instruction file. `CLAUDE.md` is only a
Claude compatibility shim that imports `AGENTS.md`; if they ever conflict,
`AGENTS.md` takes precedence.

## Guidance

Shared agent guidance lives in `.agents/`.

- `.agents/rules/architecture.md`
- `.agents/rules/documentation.md`
- `.agents/skills/update-docs/SKILL.md`

Use relevant rules and skills before making changes.
