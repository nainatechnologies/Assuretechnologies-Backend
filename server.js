const dotenv = require('dotenv');
dotenv.config();

const app = require('./src/app');
const { connectDB, sequelize } = require('./src/config/database');
require('./src/models'); // Register models

const PORT = process.env.PORT || 5000;

// Connect to the database and start the server
const startServer = async () => {
  try {
    await connectDB();

    // Automatically create tables based on models
    await sequelize.sync();
    // await sequelize.sync({ alter: true }); // Uncomment this temporarily to force a schema sync if you add new columns later

    console.log('Database connected successfully. Tables have been synced.');

    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
