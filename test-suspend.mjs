const BASE_URL = 'http://localhost:3005/api/v1/admin';

async function main() {
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ginivibe.com', password: 'supersecret' })
  });
  const login = await loginRes.json();
  const token = login.token;
  console.log('Token:', token ? 'exists' : 'failed');

  const orgsRes = await fetch(`${BASE_URL}/organizations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const orgs = await orgsRes.json();
  
  if (orgs.length > 0) {
    console.log('Suspending org:', orgs[0].id);
    const suspendRes = await fetch(`${BASE_URL}/organizations/${orgs[0].id}/suspend`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Suspend result status:', suspendRes.status);
    console.log('Suspend body:', await suspendRes.json());
  }
}
main();
