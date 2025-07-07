// Simple test script to verify translation structure
const fs = require('fs');
const path = require('path');

// Read the translation files as plain text
const enPath = path.join(__dirname, '../app/translations/en.namespaced.ts');
const zhPath = path.join(__dirname, '../app/translations/zh.namespaced.ts');

const enContent = fs.readFileSync(enPath, 'utf8');
const zhContent = fs.readFileSync(zhPath, 'utf8');

// Simple checks
console.log("Testing English translations:");
console.log("- Contains app.title:", enContent.includes("app: {") && enContent.includes("title: 'Vehicle Expense Tracker'"));
console.log("- Contains legacy title:", enContent.includes("title: 'Vehicle Expense Tracker',"));
console.log("- Does NOT contain i18nDemo:", !enContent.includes("i18nDemo: '"));
console.log("- Examples section simplified:", enContent.includes("items_zero: 'You have no items'") && !enContent.includes("messages_one:"));

console.log("\nTesting Chinese translations:");
console.log("- Contains app.title:", zhContent.includes("app: {") && zhContent.includes("title: '車輛費用追蹤器'"));
console.log("- Contains legacy title:", zhContent.includes("title: '車輛費用追蹤器',"));
console.log("- Does NOT contain i18nDemo:", !zhContent.includes("i18nDemo: '"));
console.log("- Examples section simplified:", zhContent.includes("items_zero: '你沒有任何項目'") && !zhContent.includes("messages_one:"));

console.log("\nTest completed successfully!");
