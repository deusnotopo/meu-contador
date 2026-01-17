async function testAuth() {
  const BASE_URL = 'http://localhost:3000';
  const email = `test${Date.now()}@example.com`;
  const password = 'password123';

  console.log('Testing Register...');
  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: 'Test User' }),
  });

  if (!registerRes.ok) {
    console.error('Register failed:', await registerRes.text());
    return;
  }

  const registerData = await registerRes.json();
  console.log('Register Success:', registerData);

  console.log('Testing Login...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!loginRes.ok) {
    console.error('Login failed:', await loginRes.text());
    return;
  }

  const loginData = await loginRes.json();
  console.log('Login Success:', loginData);
}

testAuth();
