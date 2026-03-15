// Test Advanced Commands
// Select functions below and right-click

// TEST 1: Generate Unit Tests
function divide(a, b) {
  return a / b;
}

// Right-click on divide function → UniCopilot: Generate Unit Tests
// Expected: Comprehensive test suite with edge cases

// TEST 2: Generate Documentation
function fetchData(url, options) {
  return fetch(url, {
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body
  });
}

// Right-click on fetchData → UniCopilot: Generate Documentation
// Expected: JSDoc with params, returns, examples

// TEST 3: Security Scan
function getUserById(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId;
  return db.execute(query);
}

// Right-click on getUserById → UniCopilot: Security Scan
// Expected: SQL injection vulnerability detected!

// TEST 4: Performance Optimization
function findDuplicates(arr) {
  const duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {
        duplicates.push(arr[i]);
      }
    }
  }
  return duplicates;
}

// Right-click on findDuplicates → UniCopilot: Optimize Performance
// Expected: O(n²) → O(n) optimization suggestion

// TEST 5: Code Review
function processPayment(amount, cardNumber, cvv) {
  const apiKey = "sk_live_123456789";
  if (amount > 0) {
    return fetch(`https://api.payment.com/charge?amount=${amount}&card=${cardNumber}&cvv=${cvv}`, {
      headers: { 'Authorization': apiKey }
    });
  }
}

// Right-click on processPayment → UniCopilot: Review Code
// Expected: Multiple issues found (hardcoded key, security, validation)
