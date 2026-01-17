async function testHealth() {
  const BASE_URL = 'http://localhost:3000';
  try {
    const res = await fetch(`${BASE_URL}/health`);
    console.log('Status:', res.status);
    console.log('Body:', await res.json());
  } catch (err) {
    console.error('Check failed:', err);
  }
}
testHealth();
