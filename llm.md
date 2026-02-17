# node-condition-builder - LLM Reference

SQL WHERE clause builder. Parameterized, injection-safe. PostgreSQL & MySQL.

```
npm install node-condition-builder
```

```typescript
import { ConditionBuilder } from 'node-condition-builder';
```

## Core pattern

```typescript
const cb = new ConditionBuilder('AND'); // or 'OR'
cb.build();      // SQL string:  (field = $1 AND field > $2)
cb.getValues();  // values array: ['val1', 'val2']
```

All methods are chainable. `undefined` values silently skip the condition (key feature for optional filters).

## Value types

```typescript
type SqlValue = string | number | boolean | bigint | Date;
type ConditionValue = SqlValue | Expression;
type ConditionValueOrUndefined = ConditionValue | undefined;
```

- Most methods accept `ConditionValueOrUndefined`
- `isIn`/`isNotIn` accept `ConditionValue[] | undefined`
- `raw()` values accept `unknown[]` (escape hatch: any value the DB driver supports)
- `null` is not accepted -- use `isNull()`/`isNotNull()` or `expression('NULL')`

## Methods

### Equality

```typescript
cb.isEqual('status', 'active')     // status = $1
cb.isNotEqual('status', 'banned')  // status != $1
```

### Comparison

```typescript
cb.isGreater('age', 18)         // age > $1
cb.isGreaterOrEqual('age', 18)  // age >= $1
cb.isLess('age', 65)            // age < $1
cb.isLessOrEqual('age', 65)     // age <= $1
```

### Range

```typescript
cb.isBetween('age', 18, 65)       // (age BETWEEN $1 AND $2)
cb.isBetween('age', 18, undefined) // age >= $1  (partial: only from)
cb.isBetween('age', undefined, 65) // age <= $1  (partial: only to)
cb.isNotBetween('age', 18, 65)    // (age NOT BETWEEN $1 AND $2)
```

### Inclusion

```typescript
cb.isIn('role', ['admin', 'editor'])     // role IN ($1, $2)
cb.isNotIn('role', ['banned', 'guest'])  // role NOT IN ($1, $2)
```

### Pattern matching

```typescript
cb.isLike('name', '%john%')    // name LIKE $1
cb.isNotLike('name', '%bot%')  // name NOT LIKE $1
cb.isILike('name', '%john%')   // name ILIKE $1  (PostgreSQL only)
cb.isNotILike('name', '%bot%') // name NOT ILIKE $1
```

### Null checks

```typescript
cb.isNull('deleted_at', true)     // deleted_at IS NULL
cb.isNotNull('verified_at', true) // verified_at IS NOT NULL
// false or undefined = no-op (condition skipped)
```

### Raw SQL

```typescript
cb.raw('ST_Distance(point, ?) < ?', [somePoint, 100])
// ST_Distance(point, $1) < $2

cb.raw('active IS TRUE') // no placeholders, always added
```

`?` = placeholder. Use `\?` for literal `?` (e.g. PostgreSQL jsonb operator).

### Expressions (no placeholder)

```typescript
cb.isEqual('created_at', cb.expression('NOW()'))
// created_at = NOW()  (no value added to params)
```

### Nesting

```typescript
const cb = new ConditionBuilder('AND')
  .isEqual('active', true)
  .append(
    new ConditionBuilder('OR')
      .isEqual('role', 'admin')
      .isEqual('role', 'editor')
  );

cb.build();     // (active = $1 AND (role = $2 OR role = $3))
cb.getValues(); // [true, 'admin', 'editor']
```

## Undefined = skip (optional filters)

```typescript
function getUsers(filters: { name?: string; role?: string; minAge?: number }) {
  const cb = new ConditionBuilder('AND')
    .isLike('name', filters.name ? `%${filters.name}%` : undefined)
    .isEqual('role', filters.role)
    .isGreaterOrEqual('age', filters.minAge);

  return db.query(`SELECT * FROM users WHERE ${cb.build()}`, cb.getValues());
}

getUsers({ name: 'john' });
// SELECT * FROM users WHERE (name LIKE $1)
// values: ['%john%']

getUsers({});
// SELECT * FROM users WHERE (TRUE)
// values: []
```

## Dialect

```typescript
ConditionBuilder.DIALECT = 'mysql'; // global: switches to ? placeholders
new ConditionBuilder('AND', 'mysql'); // per-instance override
```

Default: `postgres` (`$1, $2, ...`). MySQL uses `?`.

## Empty conditions

- Empty AND = `(TRUE)`
- Empty OR = `(FALSE)`
