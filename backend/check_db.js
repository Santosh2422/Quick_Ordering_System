import mongoose from 'mongoose';
import { config } from 'dotenv';
import User from './models/user.model.js';
import { Restaurant } from './models/restaurants.model.js';

config();

const checkDB = async () => {
    try {
        console.log('🔄 Connecting to Database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.\n');

        console.log('--- SYSTEM USERS ---');
        const users = await User.find();
        if (users.length === 0) console.log('No users found.');
        users.forEach(u => {
            console.log(`- Name: ${u.name.padEnd(15)} | Username: ${u.username?.padEnd(15) || 'N/A'.padEnd(15)} | Role: ${u.role}`);
        });

        console.log('\n--- RESTAURANTS ---');
        const rests = await Restaurant.find();
        if (rests.length === 0) console.log('No restaurants found.');
        rests.forEach(r => {
            console.log(`- Name: ${r.name.padEnd(15)} | UID: ${r.uid}`);
        });

        console.log('\n--- END OF DATA ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        process.exit(1);
    }
};

checkDB();
