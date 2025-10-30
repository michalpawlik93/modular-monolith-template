# TypeScript Rules

## General Principles
- **Goal**: Generate code that **passes ESLint** and **formats with Prettier** without manual fixes
- Prefer reusing existing libraries/components (via public APIs) over creating duplicates
- If a task is mentioned, always review its description first
- If you have any doubts or something is unclear, ask the developer
- Use **public** APIs of libraries only
- Do not duplicate code if existing implementations can be reused
- Follow **SOLID** principles and best practices
- Always decompose large tasks into smaller steps and allow reviewing between steps

## Code Standards

### Prettier Configuration
- `singleQuote: true`
- `semi: true`
- `printWidth: 120`
- `trailingComma: 'all'`
- `useTabs: true`
- `tabWidth: 4`
- `bracketSpacing: true`
- `arrowParens: 'always'`
- `proseWrap: 'always'`
- `endOfLine: 'lf'`
- HTML whitespace sensitivity: **strict**

**Always format with Prettier before presenting final code.**

### Import Rules
Use `import/order` groups with **alphabetical** order and **blank lines** between groups:
1. `builtin`, `external`, `internal`
2. `parent`, `sibling`, `index`, `object`

**Import Guidelines:**
- Enforce `sort-imports` with member order: `none`, `all`, `single`, `multiple`
- **Disallow cycles** (`import/no-cycle`)
- **Auto-remove** unused imports/variables (`unused-imports` plugin)
- **Never use deep imports** for importing types from projects
- For intentionally unused parameters, name them `_` (or `_1`, `_2`)

### Naming Conventions
- **Default**: `camelCase`
- **Variables**: `camelCase` or `UPPER_CASE`
- **Types/Interfaces/Classes**: `PascalCase`
- **Private properties/methods**: must have a leading `_` (no trailing underscore)
- **Parameters**: `camelCase`; **no leading underscore** (except `_`, `_1`, etc., for intentionally unused)

#### Class Member Ordering (top to bottom)
1. **Fields**: private → protected → public
2. **Constructors**: private → protected → public
3. **Methods**: private → protected → public

**Accessibility**: Use explicit accessibility; **constructors** should not be explicitly `public`

### TypeScript Rules
- **No `any` type** - use strict typing
- **No `@ts-ignore` or `@ts-expect-error`**
- **No `@deprecated` or `@internal` tags**
- **Single quotes** (allow escapes)
- **Always use curly braces** for blocks
- `eqeqeq: 'smart'`; `prefer-const`; `eol-last`
- **Forbid**: `var`, `debugger`, `eval`, bitwise ops, new wrapper objects, unsafe patterns
- `max-len: 120` with exceptions for long imports/exports/class declarations, template URLs, inline SVG
- `no-shadow` (hoist `all`), `no-unused-expressions`, `no-throw-literal`, `no-trailing-spaces`, `unicode-bom: 'never'`
- **JSDoc**: no types in comments
- `no-inferrable-types`: don't annotate obvious types (parameters exempt)
- `explicit-function-return-type`: warn; allowed for expressions

### Immutability & Readonly Usage
- Mark every class field, parameter property, and injected dependency that is not intended to be reassigned as `readonly`.
- Do not remove `readonly` to “fix” a mutation error; refactor code to avoid reassigning or introduce a new variable with narrower scope.
- Favor pure functions and immutable data objects (return new objects instead of mutating inputs) unless performance profiling proves a need otherwise.
- Use `as const` for literal collections when safe to lock structure and value types.

### RxJS Guidelines
- Follow `plugin:rxjs/recommended`
- Avoid `async subscribe`, **nested** `subscribe`, **unbound** methods
- Use **pipeable** operators
- Heed warnings for `throw-error`, `no-sharereplay`, etc.

## Testing Guidelines

### General Testing Principles
- All tests use **JEST** as test runner and use `.spec` suffix
- All code should be covered by unit tests
- Test files are placed near the code file:
  ```
  example.component.ts
  example.component.spec.ts
  ```

#### Test-Specific Rules
For `*.spec.ts`, `*.spec.ui.ts`, `*.stories.ts`:
- Extend Jest recommended
- **Disallow focused tests**
- Enforce `expect`/`expectObservable` usage
- `max-classes-per-file` is disabled in tests

## Quality Assurance
- All code should be covered by unit tests
- All code should be linted and fixed
- Always format code before presenting final version
- Keep imports **grouped, alphabetized**, and free of cycles
- Format with **Prettier** and fix **ESLint** issues before proposing code

## External Libraries
If adding new dependencies is justified:
- Verify license is **MIT** or **Apache 2.0**
- Ensure active community support

---
