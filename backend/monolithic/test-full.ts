async function test() {
  const email = `test-${Date.now()}@gmail.com`;
  
  // Register
  const regRes = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `testuser${Date.now()}`,
      email,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      dob: '2000-01-01',
      gender: 'Male',
      interests: []
    })
  });
  
  console.log('Reg status:', regRes.status);
  const data = await regRes.json();
  console.log('Token:', !!data.token);

  if (data.token) {
    const callRes = await fetch('http://localhost:3001/api/calls/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.token}`
      },
      body: JSON.stringify({ receiverId: 'some-id' })
    });
    console.log('Call req status:', callRes.status);
    console.log('Call req body:', await callRes.text());
  }
}
test();
