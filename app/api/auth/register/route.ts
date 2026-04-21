import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json();

    // 1. Get Admin Token using the Service Account we enabled!
    const adminTokenParams = new URLSearchParams({
      client_id: process.env.KEYCLOAK_ID,
      client_secret: process.env.KEYCLOAK_SECRET,
      grant_type: 'client_credentials'
    });

    const adminTokenRes = await fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: adminTokenParams.toString()
    });

    const adminTokens = await adminTokenRes.json();
    if (!adminTokenRes.ok) throw new Error("Could not get admin token");

    // 2. Create User securely in Keycloak via Admin API
    const adminUrl = process.env.KEYCLOAK_ISSUER.replace('/realms/movie-realm', '');
    const createUserRes = await fetch(`${adminUrl}/admin/realms/movie-realm/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminTokens.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        email,
        firstName: username,
        lastName: 'User',
        enabled: true,
        emailVerified: true,
        requiredActions: [],
        credentials: [{ type: 'password', value: password, temporary: false }]
      })
    });

    if (!createUserRes.ok && createUserRes.status !== 201) {
      const errorText = await createUserRes.text();
      try {
        const errJson = JSON.parse(errorText);
        return NextResponse.json({ error: errJson.errorMessage || errJson.error || 'Failed to create account' }, { status: 400 });
      } catch (e) {
        return NextResponse.json({ error: errorText }, { status: 400 });
      }
    }

    // 3. Fetch the newly created user's ID
    const getUserRes = await fetch(`${adminUrl}/admin/realms/movie-realm/users?username=${username}`, {
       headers: { Authorization: `Bearer ${adminTokens.access_token}` }
    });
    const users = await getUserRes.json();
    const newUserId = users[0].id;

    // 4. Save to our PostgreSQL Database
    await query(
      `INSERT INTO user_profiles (keycloak_sub, username, email) VALUES ($1, $2, $3)`,
      [newUserId, username, email]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Register Error:", err);
    return NextResponse.json({ error: 'Failed to create user securely' }, { status: 500 });
  }
}
