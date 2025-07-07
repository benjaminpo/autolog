// Test script to verify that all expense categories are properly supported
const fs = require('fs');
const path = require('path');

// Read the vehicleData.ts file directly
const vehicleDataPath = path.resolve(process.cwd(), 'app/lib/vehicleData.ts');
const fileContent = fs.readFileSync(vehicleDataPath, 'utf8');

// Extract expense categories using regex
const expenseCategoriesMatch = fileContent.match(/export const expenseCategories: string\[\] = \[([\s\S]*?)\];/);
const categoriesString = expenseCategoriesMatch ? expenseCategoriesMatch[1] : '';
const expenseCategories = categoriesString
  .split(',')
  .map(category => category.trim().replace(/^'|'$/g, '').replace(/^"|"$/g, ''))
  .filter(category => category);

// Print out all expense categories to verify they're loaded correctly
console.log('Available Expense Categories:');
expenseCategories.forEach((category, index) => {
  console.log(`${index + 1}. ${category}`);
});

// Verify that all the categories we added are present
const requiredCategories = [
  'Insurance',
  'Road Tax',
  'Vehicle Tax',
  'Vehicle Purchase',
  'Vehicle Accident',
  'Vehicle Service',
  'Car Wash',
  'Fine',
  'MOT'
];

console.log('\nVerifying required categories:');
let allFound = true;

requiredCategories.forEach(category => {
  const found = expenseCategories.includes(category);
  console.log(`${category}: ${found ? '✅ Found' : '❌ Missing'}`);
  if (!found) allFound = false;
});

if (allFound) {
  console.log('\n✅ All required categories are present!');
} else {
  console.log('\n❌ Some required categories are missing!');
}
