const app = require('./app');
const { setupDatabase } = require('./config/tables');

const PORT = Number(process.env.PORT) || 5000;

(async () => {
  try {
    await setupDatabase();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Fatal error during startup:', error);
    process.exit(1);
  }
})();
