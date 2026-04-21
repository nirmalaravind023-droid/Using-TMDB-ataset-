const fetch = require('node-fetch');

async function testLogin() {
  const params = new URLSearchParams({
    client_id: 'movie-app',
    client_secret: process.env.KEYCLOAK_SECRET || 'your_client_secret_here', // I need the actual secret
    grant_type: 'password',
    username: 'movieking',
    password: 'password123' // Wait, I don't know the user's password!
  });

  console.log("Testing...");
}
