# Nx Rules

## Project Architecture

### Workspace Structure
This is an **Nx workspace** using Nx and npm as the package manager.

**Project Types:**
- `lib` - Libraries
- `app` - Applications

**Library Types:**
- `core` - Core logic shared for all packages. Utility functions, helpers, core features
- `domain` - Domains in modular monolith architecture

#### Folder Structure
```
libs/
  core/
    utils/
    features/
        [feature-name]/  
  [domain-name]/
    application/
         features/
            [feature-name]/
                facades/
                handlers/
                services/
    domain/
        models/
    infrastructure/
        [provider-name]/
            clients/
            models/
            services/
apps/
  [app-name]/
```

## Nx Workspace Management

### Using Nx CLI
**Always use Nx for running workspace commands** - do not use scripts from package.json

**Command Patterns:**
- Testing: `npx nx test [project-type].[scope].[project-name]`
- Building: `npx nx build [project-type].[scope].[project-name]`
- Linting: `npx nx lint [project-type].[scope].[project-name]`

### Linting
- All projects must contain lint target
- All code should be linted and fixed
- For running linting always use Nx CLI

## Project-Specific Import Rules
- **Disallow cycles** (`import/no-cycle`)