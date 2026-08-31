import { createApp } from './app.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app = createApp();

app.listen(PORT, () => {
  console.info(`=================================================`);
  console.info(` Verdict Intelligence Backend Engine`);
  console.info(` Running on: http://localhost:${PORT}`);
  console.info(` Healthcheck: http://localhost:${PORT}/v1/status`);
  console.info(` Analyze API: POST http://localhost:${PORT}/v1/analyze`);
  console.info(`=================================================`);
});
