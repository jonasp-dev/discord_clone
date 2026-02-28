# Working Agreements (AI + Humans)

This document defines the required workflow, safety rules, and quality standards for all changes made in this repository.

These rules apply to both AI agents and human contributors.

---

# Core Principles

## 1. Make Small, Safe Changes
- Prefer small, incremental changes over large rewrites.
- Default limits per iteration:
  - ≤ 300 lines changed
  - ≤ 5 files modified
- If exceeding limits, explicitly justify why.

## 2. Do Not Modify Unrelated Code
- Only change code required for the task.
- Do not refactor, rename, reformat, or reorganize unrelated files.

## 3. Preserve Existing Behavior
- Assume existing functionality is intentional.
- Do not change behavior unless explicitly required.
- If behavior changes, document:
  - Previous behavior
  - New behavior
  - Reason for change

---

# Mandatory Gated Workflow

All tasks must follow these gates in order.

Do not skip gates.

---

## Gate 0 — Scope

Document:

- Requirements summary
- Acceptance criteria
- Non-goals
- Constraints

---

## Gate 1 — Design (NO CODE)

Document:

- Proposed approach
- Exact files to modify
- Interfaces affected (APIs, functions, schema, file formats)
- Test plan
- Assumptions
- Risks

Do not write code until Gate 1 is complete.

---

## Gate 2 — Implementation

Rules:

- Modify only required files
- Keep changes minimal
- Do not refactor unrelated code
- Follow existing patterns and conventions
- Add or update tests when applicable

---

## Gate 3 — Verification

Provide:

- Commands to build/test/lint
- Expected results
- Manual test steps if automated tests are unavailable

Example:
```bash
npm test
npm run lint
npm run build
```
---

## Gate 4 — Handoff

Provide:

- Summary of changes
- Files modified
- How to verify functionality
- Rollback instructions if applicable

---

# File Safety Rules

## Never Assume Files Exist
Always verify files before modifying them.

## Never Invent APIs or Interfaces
Only use existing functions, types, schema, or explicitly create new ones.

## Never Silently Change Interfaces

If modifying:

- Function signatures
- Database schema
- API contracts
- File formats

Document impact and required updates.

---

# Dependency Safety

Do not introduce new dependencies unless necessary.

If adding a dependency, document:

- Why it is needed
- Alternatives considered
- Impact on build and runtime

---

# Database Safety (If Applicable)

When modifying schema:

Must include:

- Migration
- Rollback plan
- Data safety considerations

Avoid destructive operations unless explicitly required.

---

# Testing Requirements

Functional changes must include at least one of:

- Unit test
- Integration test
- Manual test plan

Tests should verify:

- Expected behavior
- Failure cases where applicable

---

# Observability and Debugging

New functionality should include sufficient visibility to debug issues.

Examples:

- Logging at system boundaries
- Proper error handling
- Meaningful error messages

Avoid excessive or noisy logging.

---

# Communication Requirements

Always document:

## Assumptions
What is assumed to be true.

## Unknowns
What requires clarification.

## Risks
What could break or behave unexpectedly.

Do not silently guess when clarification is possible.

---

# Priority Order for Decisions

When making tradeoffs, prioritize:

1. Correctness
2. Safety
3. Minimal change surface
4. Maintainability
5. Performance (unless performance is the primary goal)

---

# Definition of Done

Work is complete only when:

- Requirements satisfied
- Design documented (Gate 1)
- Implementation complete (Gate 2)
- Verification steps provided (Gate 3)
- Handoff documentation provided (Gate 4)
- No unrelated code modified

---

## Operational Considerations

All changes must evaluate impact on cost, security, and scalability when applicable.

Operational Considerations are REQUIRED if changes affect:
- network calls / external APIs
- authentication / authorization / secrets
- database queries, schema, migrations
- cloud resources (S3, Snowflake, queues, etc.)
- concurrency / background jobs
- performance-critical paths or large data processing

Document considerations in Gate 1 — Design.

### Cost

Consider:

- Database query efficiency
- Avoid unnecessary full-table scans
- Avoid redundant API calls
- Avoid excessive memory or CPU usage
- Avoid excessive logging volume
- Avoid unnecessary network calls
- Avoid unnecessary cloud resource usage

Prefer efficient solutions over wasteful ones.

---

### Security

Consider:

- Input validation
- Avoid injection vulnerabilities (SQL, command, etc.)
- Do not expose secrets, credentials, or sensitive data
- Follow least-privilege access principles
- Do not log sensitive information
- Validate authentication and authorization boundaries

Never introduce security regressions.

Document any security implications.

---

### Scalability

Consider:

- Behavior with large datasets
- Behavior with high request volume
- Algorithmic complexity (avoid unnecessary O(n²) or worse)
- Database indexing requirements
- Avoid synchronous blocking operations on critical paths
- Avoid unnecessary serialization/deserialization overhead

Design for predictable performance under growth.

Document scalability implications.

### Required in Gate 1 — Design

Include a section:

Cost impact:
- ...

Security considerations:
- ...

Scalability considerations:
- ...

# Enforcement

If any gate is skipped or rules violated:

Stop work immediately.

Return to the appropriate gate and correct the issue.

Do not proceed until compliant.