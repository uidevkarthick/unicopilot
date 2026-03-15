// Test Context Tags
// Select code below and use in chat

function processUserData(users) {
  return users
    .filter(user => user.age > 18)
    .map(user => ({
      id: user.id,
      name: user.name.toUpperCase(),
      email: user.email
    }));
}

// Test commands in chat:
// 1. Select this function
// 2. In chat: "Explain @selection"
// 3. In chat: "What bugs exist in @file?"
// 4. In chat: "Review @selection for best practices"
