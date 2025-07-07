# Translation Utils Testing Documentation

## Overview

This document describes the comprehensive unit testing approach for the translation utilities in `app/translations/utils.ts`. The testing suite covers all three main functions with extensive edge case testing and integration scenarios.

## Test Coverage Summary

- **Total Tests**: 50 tests across 4 describe blocks
- **Coverage**: 100% statement, branch, function, and line coverage
- **Test File**: `__tests__/lib/translationUtils.test.ts`

## Functions Tested

### 1. `interpolate(text: string, params?: Record<string, any>): string`

**Purpose**: Replaces variables in translation strings with values from params object.

**Test Coverage**: 15 tests covering:

#### Core Functionality
- ✅ Single variable replacement: `"Hello, {{name}}!"` → `"Hello, World!"`
- ✅ Multiple variable replacement with complex templates
- ✅ Variable names with numbers and special characters (`{{user_id}}`, `{{item_count}}`)

#### Type Handling
- ✅ Non-string value conversion (numbers, booleans, null to strings)
- ✅ Zero and undefined value handling
- ✅ Missing variable preservation (`{{missing}}` stays unchanged)

#### Edge Cases
- ✅ Empty and null params handling
- ✅ Undefined params handling
- ✅ Empty and null text handling
- ✅ Text with no variables
- ✅ Nested braces and malformed patterns
- ✅ Variables with spaces (not supported, preserved as-is)

### 2. `pluralize(count: number, forms: object, params?: Record<string, any>): string`

**Purpose**: Handles pluralization based on count with interpolation support.

**Test Coverage**: 13 tests covering:

#### Core Pluralization Logic
- ✅ "one" form selection when count is 1
- ✅ "other" form selection when count > 1
- ✅ "zero" form selection when count is 0 (with fallback to "other")

#### Parameter Integration
- ✅ Count parameter automatic injection
- ✅ Additional parameter interpolation
- ✅ Parameter precedence (count parameter takes priority)

#### Edge Cases
- ✅ Negative count handling
- ✅ Decimal count handling
- ✅ Large number handling (1,000,000+)
- ✅ Empty params object handling
- ✅ Complex interpolation with zero form

### 3. `getNestedTranslation(obj: any, path: string, defaultValue?: string): string`

**Purpose**: Deep getter for nested translation keys with dot notation.

**Test Coverage**: 19 tests covering:

#### Core Functionality
- ✅ Simple nested value retrieval (`"user.greeting"`)
- ✅ Deeply nested value retrieval (`"user.messages.welcome"`)
- ✅ Top-level value retrieval with object stringification

#### Default Value Handling
- ✅ Default value return for non-existent paths
- ✅ Custom default value support
- ✅ Empty string, zero, and false value handling

#### Error Handling
- ✅ Null and undefined object handling
- ✅ Empty and null path handling
- ✅ Malformed path handling (dots at start/end, consecutive dots)

#### Advanced Scenarios
- ✅ Array-like object support (`"items.1"`)
- ✅ Numeric key support (`"0"`, `"nested.2"`)
- ✅ Special characters in keys (dashes, underscores)
- ✅ Null/undefined values in nested paths

### 4. Integration Tests

**Purpose**: Test function combinations and real-world usage scenarios.

**Test Coverage**: 3 tests covering:

#### Function Combinations
- ✅ Nested translation → pluralization → interpolation chain
- ✅ Complex nested interpolation with dot notation in variable names
- ✅ Edge case combinations with graceful error handling

## Test Quality Features

### Comprehensive Edge Case Coverage
- **Null/Undefined Handling**: All functions tested with null/undefined inputs
- **Empty Value Handling**: Empty strings, empty objects, empty arrays
- **Type Safety**: Proper handling of different data types
- **Error Boundaries**: Graceful degradation when inputs are malformed

### Real-World Scenarios
- **Integration Testing**: Functions working together as they would in production
- **Parameter Passing**: Complex parameter objects with nested structures
- **Fallback Behavior**: Proper fallbacks when translations are missing

### Performance Considerations
- **Large Data Handling**: Tests with large numbers and complex objects
- **Edge Performance**: Deeply nested objects and long path strings

## Example Test Cases

### Basic Interpolation
```typescript
interpolate('Hello, {{name}}!', { name: 'World' })
// Expected: 'Hello, World!'
```

### Complex Pluralization
```typescript
pluralize(0, {
  one: '{{user}} has {{count}} unread message',
  other: '{{user}} has {{count}} unread messages',
  zero: '{{user}} has no unread messages'
}, { user: 'Bob' })
// Expected: 'Bob has no unread messages'
```

### Nested Translation
```typescript
getNestedTranslation({
  user: { messages: { welcome: 'Welcome back!' } }
}, 'user.messages.welcome')
// Expected: 'Welcome back!'
```

### Integration Example
```typescript
const translations = {
  messages: {
    items: {
      one: 'You have {{count}} item in {{location}}',
      other: 'You have {{count}} items in {{location}}'
    }
  }
};

const forms = getNestedTranslation(translations, 'messages.items');
const result = pluralize(3, forms, { location: 'basket' });
// Expected: 'You have 3 items in basket'
```

## Test Execution

```bash
# Run translation utils tests specifically
npm test -- __tests__/lib/translationUtils.test.ts

# Run with coverage
npm test -- __tests__/lib/translationUtils.test.ts --coverage

# Run in watch mode
npm test -- __tests__/lib/translationUtils.test.ts --watch
```

## Benefits of This Testing Approach

1. **100% Code Coverage**: Every line, branch, and function is tested
2. **Edge Case Protection**: Comprehensive coverage of error conditions
3. **Regression Prevention**: Detailed tests prevent future breaking changes
4. **Documentation**: Tests serve as living documentation of expected behavior
5. **Confidence**: Developers can modify code knowing tests will catch issues
6. **Integration Assurance**: Tests verify functions work together correctly

## Maintenance

These tests should be updated when:
- New features are added to translation utilities
- Edge cases are discovered in production
- Performance optimizations are made
- API changes are introduced

The comprehensive nature of these tests ensures that the translation system remains robust and reliable as the application evolves. 