// backend/src/models/PaddockMessage.ts
import mongoose from 'mongoose';

const paddockMessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true }, // 👈 ADD THIS LINE
  username: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export const PaddockMessage = mongoose.model('PaddockMessage', paddockMessageSchema);