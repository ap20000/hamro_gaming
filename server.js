import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.set('bufferCommands', false);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');

  // Import app only after DB connection to ensure env is loaded
  import('./app.js').then(({ default: app }) => {
    // Start the server inside app.js, so no need to start here
    // Just ensure app.js runs now that DB connected
  });
})
.catch((err) => {
  console.error('DB connection failed:', err);
  process.exit(1);
});
