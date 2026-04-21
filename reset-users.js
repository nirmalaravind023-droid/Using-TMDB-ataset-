// Uses native fetch

async function resetUsers() {
  console.log("🔄 Resetting Keycloak Users...");

  try {
    // 1. Get Admin Token
    const tokenRes = await fetch("http://localhost:8080/realms/master/protocol/openid-connect/token", {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: 'admin-cli',
        grant_type: 'password',
        username: 'admin',
        password: 'admin'
      }).toString()
    });
    
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    // 2. Get all users in movie-realm
    const usersRes = await fetch("http://localhost:8080/admin/realms/movie-realm/users", {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const users = await usersRes.json();
    
    // 3. Delete them all
    let deletedCount = 0;
    for (const user of users) {
      const delRes = await fetch(`http://localhost:8080/admin/realms/movie-realm/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (delRes.ok) {
        console.log(`✅ Deleted user: ${user.username}`);
        deletedCount++;
      }
    }
    
    console.log(`🎉 Successfully wiped ${deletedCount} users from Keycloak!`);

  } catch (err) {
    console.error("Error wiping users:", err);
  }
}

resetUsers();
