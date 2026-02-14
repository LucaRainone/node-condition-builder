# ConditionBuilder

A lightweight TypeScript library for building parameterized SQL WHERE clauses. It generates safe, injection-free condition strings with proper placeholder indexing for PostgreSQL and MySQL.

## What it is

A **condition builder** -- it takes your filter parameters and produces a SQL condition string plus an ordered array of values, ready to be passed to any database driver's parameterized query.

## What it is NOT

- Not an ORM
- Not a query builder -- it only handles the WHERE clause
- Not a database driver -- it produces strings, you execute them

## Use cases

- Building dynamic filters where conditions are optional
- APIs with search/filter endpoints where any combination of parameters may be present
- Anywhere you need safe, parameterized SQL conditions without string concatenation

## Install

```
npm install js-condition-builder
```

## Quick start

```typescript
import { ConditionBuilder } from 'js-condition-builder';

const condition = new ConditionBuilder('AND')
  .isEqual('status', 'active')
  .isGreater('age', 18)
  .isNull('deleted_at', true);

condition.build();     // (status = $1 AND age > $2 AND deleted_at IS NULL)
condition.getValues(); // ['active', 18]
```

## Undefined values are ignored

This is the key feature. When a value is `undefined`, the condition is silently skipped. This makes it trivial to build dynamic filters from optional parameters:

```typescript
interface UserFilters {
  name?: string;
  email?: string;
  role?: string;
  minAge?: number;
  maxAge?: number;
  isVerified?: boolean;
  excludeRoles?: string[];
}

function filterUsers(filters: UserFilters) {
  const condition = new ConditionBuilder('AND')
    .isLike('name', filters.name ? `%${filters.name}%` : undefined)
    .isEqual('email', filters.email)
    .isEqual('role', filters.role)
    .isGreaterOrEqual('age', filters.minAge)
    .isLessOrEqual('age', filters.maxAge)
    .isNotNull('verified_at', filters.isVerified)
    .isNotIn('role', filters.excludeRoles);

  const sql = `SELECT * FROM users WHERE ${condition.build()}`;
  const values = condition.getValues();

  return db.query(sql, values);
}

// Only name and minAge provided:
filterUsers({ name: 'john', minAge: 18 });
// SELECT * FROM users WHERE (name LIKE $1 AND age >= $2)
// values: ['%john%', 18]

// No filters at all:
filterUsers({});
// SELECT * FROM users WHERE (TRUE)
// values: []
```

## API

Every method is chainable and returns `this`.

### Equality

| Method | SQL |
|---|---|
| `isEqual(field, value)` | `field = $1` |
| `isNotEqual(field, value)` | `field != $1` |

### Comparison

| Method | SQL |
|---|---|
| `isGreater(field, value)` | `field > $1` |
| `isGreaterOrEqual(field, value)` | `field >= $1` |
| `isLess(field, value)` | `field < $1` |
| `isLessOrEqual(field, value)` | `field <= $1` |
| `isNotGreater(field, value)` | `field <= $1` |
| `isNotGreaterOrEqual(field, value)` | `field < $1` |
| `isNotLess(field, value)` | `field >= $1` |
| `isNotLessOrEqual(field, value)` | `field > $1` |

### Range

| Method | SQL |
|---|---|
| `isBetween(field, from, to)` | `(field BETWEEN $1 AND $2)` |
| `isNotBetween(field, from, to)` | `(field NOT BETWEEN $1 AND $2)` |

`isBetween` supports partial bounds: if only `from` is provided it becomes `>=`, if only `to` it becomes `<=`. Passing `null` throws an error (use `undefined` to skip a bound).

### Inclusion

| Method | SQL |
|---|---|
| `isIn(field, values)` | `field IN ($1, $2, ...)` |
| `isNotIn(field, values)` | `field NOT IN ($1, $2, ...)` |

### Pattern matching

| Method | SQL |
|---|---|
| `isLike(field, value)` | `field LIKE $1` |
| `isNotLike(field, value)` | `field NOT LIKE $1` |
| `isILike(field, value)` | `field ILIKE $1` |
| `isNotILike(field, value)` | `field NOT ILIKE $1` |

`ILIKE` is PostgreSQL-specific (case-insensitive LIKE).

### Null checks

| Method | SQL |
|---|---|
| `isNull(field, true)` | `field IS NULL` |
| `isNotNull(field, true)` | `field IS NOT NULL` |

The boolean parameter controls whether the condition is added. `isNull('f', false)` is a no-op.

### Raw expressions

Use `expression()` to inject raw SQL where a value is expected. No placeholder is generated and no value is added to the parameter array:

```typescript
const condition = new ConditionBuilder('AND')
  .isEqual('created_at', condition.expression('NOW()'))
  .isGreater('updated_at', condition.expression("NOW() - INTERVAL '1 day'"));

condition.build();     // (created_at = NOW() AND updated_at > NOW() - INTERVAL '1 day')
condition.getValues(); // []
```

### Raw conditions

Use `raw()` to inject an arbitrary SQL fragment as a condition. Use `?` as placeholder markers -- they will be replaced with the dialect's placeholders and values will be tracked:

```typescript
const condition = new ConditionBuilder('AND')
  .isEqual('name', 'test')
  .raw('ST_Distance(point, ?) < ?', [somePoint, 100]);

condition.build();     // (name = $1 AND ST_Distance(point, $2) < $3)
condition.getValues(); // ['test', somePoint, 100]
```

You can also use `raw()` without values for static fragments:

```typescript
condition.raw('active IS TRUE');
```

Use `\?` to include a literal `?` without it being treated as a placeholder (useful for PostgreSQL's jsonb `?` operator):

```typescript
condition.raw('data::jsonb \\? ? AND active = ?', ['key', true]);
// → data::jsonb ? $1 AND active = $2
```

### Nesting with `append`

Use `append()` to nest a ConditionBuilder inside another, mixing AND/OR logic:

```typescript
const condition = new ConditionBuilder('AND')
  .isEqual('active', true)
  .append(
    new ConditionBuilder('OR')
      .isEqual('role', 'admin')
      .isEqual('role', 'editor')
  );

condition.build();     // (active = $1 AND (role = $2 OR role = $3))
condition.getValues(); // [true, 'admin', 'editor']
```

Nesting is recursive -- you can nest as deep as you need.

## Dialects

PostgreSQL (`$1, $2, ...`) is the default. You can switch to MySQL (`?`) globally or per instance:

```typescript
// Global
ConditionBuilder.DIALECT = 'mysql';

// Per instance (overrides global)
const condition = new ConditionBuilder('AND', 'mysql');
```

## Empty conditions

An empty AND evaluates to `(TRUE)`, an empty OR to `(FALSE)`. This is safe to include in any query.
