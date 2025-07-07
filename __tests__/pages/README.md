# Page Tests

This directory contains comprehensive unit tests for all major pages in the Vehicle Expense Tracker application.

## Test Files Created

1. **HomePage.test.tsx** - Tests authentication redirects and loading states
2. **LoginPage.test.tsx** - Tests form interactions and multi-language support  
3. **AddFuelPage.test.tsx** - Tests fuel entry form and API interactions
4. **FuelHistoryPage.test.tsx** - Tests data listing and pagination
5. **StatisticsPage.test.tsx** - Tests charts and statistics display

## Testing Patterns

Each page test covers:
- Component rendering
- User interactions
- Data loading
- Error handling
- Accessibility
- Responsive design

## Running Tests

```bash
# Run all page tests
npm test __tests__/pages/

# Run specific test
npm test HomePage.test.tsx
```