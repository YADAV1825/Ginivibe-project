async function test() {
  const res = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aman@gmail.com', password: 'password123' })
  });
  console.log('Login status:', res.status);
  const data = await res.json();
  console.log('Token:', data.token);

  if (data.token) {
    const callRes = await fetch('http://localhost:3001/api/calls/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.token}`
      },
      body: JSON.stringify({ receiverId: 'some-id' })
    });
    console.log('Call request status:', callRes.status);
    console.log('Call request body:', await callRes.text());
  }
}
test();
