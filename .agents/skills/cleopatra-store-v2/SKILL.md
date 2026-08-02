```markdown
# cleopatra-store-v2 Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `cleopatra-store-v2` TypeScript codebase. It covers file naming, import/export styles, commit message conventions, and testing patterns. While no formal framework or automated workflows are detected, this guide provides best practices and common commands to streamline your development process.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names.
  - Example: `userProfile.ts`, `productList.test.ts`

### Import Style
- Use **alias imports** where possible.
  - Example:
    ```typescript
    import { Product } from '@models/product';
    ```

### Export Style
- Use a **mixed export style** (both named and default exports may be present).
  - Example:
    ```typescript
    // Named export
    export function calculateTotal() { ... }

    // Default export
    export default ShoppingCart;
    ```

### Commit Messages
- Follow **conventional commit** format.
- Use the `feat` prefix for new features.
- Keep commit messages concise (average ~72 characters).
  - Example:
    ```
    feat: add product filtering by category
    ```

## Workflows

### Feature Development
**Trigger:** When adding a new feature to the codebase  
**Command:** `/feature`

1. Create a new branch for your feature.
2. Implement the feature using TypeScript, following camelCase file naming.
3. Use alias imports for dependencies.
4. Export new modules using named or default exports as appropriate.
5. Write or update tests in files matching `*.test.*`.
6. Commit changes using the `feat` prefix and a concise message.
7. Open a pull request for review.

### Testing
**Trigger:** When verifying code changes  
**Command:** `/test`

1. Locate or create test files using the `*.test.*` pattern.
2. Write tests for new or updated functionality.
3. Run the test suite using the project's test runner (framework unknown; check project scripts).
4. Ensure all tests pass before merging changes.

## Testing Patterns

- Test files use the `*.test.*` naming pattern (e.g., `cart.test.ts`).
- The specific testing framework is unknown; refer to project documentation or scripts for details.
- Place tests alongside the modules they cover or in a dedicated test directory.

  ```typescript
  // Example test file: productList.test.ts
  import { filterProducts } from '@utils/productList';

  test('filters products by category', () => {
    // ...test implementation
  });
  ```

## Commands
| Command    | Purpose                                 |
|------------|-----------------------------------------|
| /feature   | Start a new feature development workflow|
| /test      | Run or write tests for the codebase     |
```
