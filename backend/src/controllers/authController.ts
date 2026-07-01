import { Request, Response } from 'express';
import { User } from '../models/User.js'; // Ensure the path matches your structure

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'User already exists.' });
      return;
    }

    // 2. Create new user (We'll add password hashing in the next step)
    const newUser = new User({ email, password });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed.' });
  }
};