import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models.ts';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'f89c0e295327ba553a5a0400545b0400f6d5a69d4490b01ca7c2b444008a078999f81e1a5fe359c77fc06ed868bca2e6af7ae46a66c94cb0af8ba6bb7a9fe7a1';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt for username: ${username}`);
  
  try {
    const user = await User.findOne({ username }).populate('labId');

    if (!user) {
      console.log(`User not found: ${username}`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (!bcrypt.compareSync(password, user.password || '')) {
      console.log(`Invalid password for user: ${username}`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ 
      id: user._id, 
      username: user.username, 
      role: user.role,
      labId: user.labId?._id 
    }, JWT_SECRET);

    console.log(`Login successful: ${username} (${user.role})`);
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        role: user.role, 
        name: user.name,
        labId: user.labId?._id 
      } 
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'A server error occurred during login.' });
  }
});

export default router;
