---
name: karpathy-guidelines
description: Behavioral guidelines to reduce common LLM coding mistakes. Use when writing, reviewing, or refactoring code to avoid overcomplication, make surgical changes, surface assumptions, and define verifiable success criteria.
license: MIT
---

# Karpathy Guidelines

Behavioral guidelines derived from Andrej Karpathy's observations on common LLM coding pitfalls.

## 1. Think Before Coding
- Surface assumptions explicitly.
- Clarify ambiguity before implementation.
- State tradeoffs and simpler alternatives when relevant.

## 2. Simplicity First
- Use the minimum code that solves the task.
- Avoid speculative abstractions and unrequested flexibility.

## 3. Surgical Changes
- Modify only lines required by the request.
- Match existing style and structure.
- Avoid unrelated cleanup/refactors.

## 4. Goal-Driven Execution
- Define clear, testable success criteria.
- Break work into verifiable steps.
- Verify outcomes before declaring completion.
