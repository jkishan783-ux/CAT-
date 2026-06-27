import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';

// Load environmental variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function makeAdmin() {
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in backend/.env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully.');

    const targetEmail = 'jkishan783@gmail.com'.toLowerCase().trim();
    console.log(`Searching for user with email: "${targetEmail}"...`);

    const updatedUser = await User.findOneAndUpdate(
      { email: targetEmail },
      { role: 'admin' },
      { new: true }
    );

    if (!updatedUser) {
      console.warn(`User with email "${targetEmail}" was not found in the database.`);
      console.log('Note: Please make sure you have registered first via the signup page.');
    } else {
      console.log(`Success! User "${updatedUser.name}" has been promoted to Admin role:`, {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    }
  } catch (error) {
    console.error('An error occurred during execution:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

makeAdmin();
