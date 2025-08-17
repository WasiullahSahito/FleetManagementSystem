// routes/accidents.js
import express from 'express';
import Accident from '../models/Accident.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Basic CRUD for accidents - you can expand this later
router.post('/', authenticate, async (req, res) => {
    try {
        const newAccident = new Accident(req.body);
        await newAccident.save();
        res.status(201).json(newAccident);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/', authenticate, async (req, res) => {
    try {
        const accidents = await Accident.find().populate('vehicle');
        res.json(accidents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;