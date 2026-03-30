import { app } from './app';
import { startWorkers } from './workers/notifier';

async function bootstrap() {
  try {
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`?? Server running at http://localhost:${port}`);
    startWorkers();
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
