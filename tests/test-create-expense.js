// Test script to verify creating expense entries with new categories
const fetch = require('node-fetch');

// Base URL for the API
const API_URL = 'http://localhost:3001/api';

// Sample expense entry using a new category
const testExpense = {
  carId: '65555555555555555555555', // Replace with a valid car ID when testing
  category: 'Insurance', // Using one of the new categories
  amount: 500,
  currency: 'USD',
  date: new Date().toISOString().split('T')[0], // Today's date
  notes: 'Test expense with new category'
};

// Function to create a test expense entry
async function createTestExpense() {
  try {
    console.log('Creating test expense entry with category:', testExpense.category);

    const response = await fetch(`${API_URL}/expense-entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testExpense),
      credentials: 'include',
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Successfully created expense entry:', data);
      console.log('The new category was accepted by the API.');
    } else {
      console.error('❌ Failed to create expense entry:', data);
      console.error('Status:', response.status);
    }
  } catch (error) {
    console.error('❌ Error creating test expense:', error);
  }
}

// Run the test
console.log('Running test to create expense with new category...');
console.log('Note: You need to be logged in via the browser for this test to work.');
console.log('Note: You need to update the carId in the script with a valid ID from your database.');
createTestExpense();
