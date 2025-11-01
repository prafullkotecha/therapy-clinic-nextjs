---
description: Run comprehensive TypeScript type checking
---

# TypeScript Type Check

Run type checking and fix any issues found.

## Instructions

1. **Run type checker**:
   ```bash
   npm run check:types
   ```

2. **If errors found**, follow TypeScript best practices from CLAUDE.md:

### Module Augmentation Errors
- **MUST** use `interface` not `type` for declaration merging
- Add `// eslint-disable-next-line ts/consistent-type-definitions` if needed
- Ensure file has import/export (module scope)

### Type Assertion Issues
- **NEVER** use `as` to bypass type errors
- Use type guards or type predicates instead
- Document if absolutely necessary

### Generic Issues
- Check generic placement (function vs interface level)
- Verify type inference working correctly
- Use function overloads if generics don't fit

### Common Fixes

**Problem**: Property doesn't exist on type
```typescript
// ❌ Wrong
const value = obj.property; // Error

// ✅ Correct - Type guard
if ('property' in obj) {
  const value = obj.property;
}
```

**Problem**: Type 'X' is not assignable to type 'Y'
```typescript
// ❌ Wrong
const result: Y = x as Y;

// ✅ Correct - Fix the actual type
const result: Y = transformXtoY(x);
```

**Problem**: Module augmentation not working
```typescript
// ❌ Wrong - Using type
declare module 'lib' {
  type Interface = { new: string };
}

// ✅ Correct - Using interface
declare module 'lib' {
  type Interface = {
    new: string;
  };
}
```

3. **Run linter** to catch style issues:
   ```bash
   npm run lint
   ```

4. **Fix issues** following CLAUDE.md guidelines:
   - Declare return types for top-level functions
   - Use `interface extends` over `type &`
   - Leverage type inference
   - No `any` without justification

5. **Verify fix**:
   ```bash
   npm run check:types && npm run lint
   ```

## Remember

From CLAUDE.md TypeScript Best Practices:

> **NEVER use type assertions or `any` to bypass errors.** If you encounter a type error:
> 1. **Understand the root cause** - What is TypeScript trying to protect you from?
> 2. **Fix the types correctly** - Use proper type narrowing, guards, or generics
> 3. **Document why** - If a workaround is needed, explain in comments
