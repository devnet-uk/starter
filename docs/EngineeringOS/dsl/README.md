# Engineering OS DSL Documentation

## Overview

This directory contains the complete technical documentation for the custom Domain-Specific Language (DSL) that powers the entire Engineering OS. This DSL is the foundation that allows AI agents and human developers to communicate, execute complex workflows, and adhere to project standards in a structured and predictable way.

These documents define the "language" of the operating system itself.

## Contents

This folder provides three distinct but complementary views of the DSL, each tailored to a specific audience:

### 1. `dsl-specification.md` - The Formal Specification

*   **Purpose:** Provides the formal, technical definition of the language syntax, elements, attributes, validation rules, and performance requirements.
*   **Audience:** System architects and developers who need to understand the precise grammar and rules of the DSL at the deepest level.
*   **Analogy:** The official dictionary and grammar book for the language.

### 2. `AGENT-INSTRUCTIONS.md` - The AI's Rulebook

*   **Purpose:** Instructs the AI agents on how to correctly interpret and execute the DSL. It covers operational logic, context management, error handling, and how to coordinate with other agents.
*   **Audience:** Primarily the AI agents themselves. Also useful for developers who are debugging agent behavior.
*   **Analogy:** The operational manual for the machine that runs on the language.

### 3. `DSL-GUIDE.md` - The Developer's Handbook

*   **Purpose:** A practical, step-by-step guide for human developers on how to use and extend the Engineering OS. It provides tutorials and best practices for creating new commands and adding new standards.
*   **Audience:** Developers who want to build upon or customize the system.
*   **Analogy:** The user-friendly textbook for learning how to write in the language.

## How to Use This Documentation

- To understand **what the language is**, read the `dsl-specification.md`.
- To understand **how to write in the language**, read the `DSL-GUIDE.md`.
- To understand **how the AI understands the language**, read the `AGENT-INSTRUCTIONS.md`.
