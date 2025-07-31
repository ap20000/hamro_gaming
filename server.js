import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app.js';

// Load environment variables
dotenv.config();

mongoose.set('bufferCommands', false);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');

  // Start the server only after DB is connected
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('DB connection failed:', err);
  process.exit(1); // Exit app if DB connection fails
});
