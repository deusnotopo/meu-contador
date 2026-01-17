try {
  const jwt = require('@fastify/jwt');
  console.log('✅ @fastify/jwt found');
} catch (e) {
  console.error('❌ @fastify/jwt not found:', e.message);
}
