const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.oygqsiclbkixwkvabdzg:G5Qjgokv7V7W5tcL@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
});

client.connect()
  .then(() => {
    console.log('Connected successfully!');
    client.end();
  })
  .catch(err => {
    console.error('Connection error:', err.message);
    process.exit(1);
  });
