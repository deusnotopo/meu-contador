import fastify from 'fastify';
const app = fastify({ logger: true });
app.get('/', async () => ({ hello: 'world' }));
app.listen({ port: 3001 }, (err) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('Server listening on port 3001');
});
