const mongoose = require('mongoose');
require('dotenv').config();

const Task = require('./models/Task');
const User = require('./models/User');

async function fixAllTasks() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Get first user to assign as creator for old tasks
        const firstUser = await User.findOne();

        if (!firstUser) {
            console.log('No users found! Create a user first.');
            process.exit(1);
        }

        console.log(`Using user: ${firstUser.email} as default creator`);

        // Update all tasks
        const result = await Task.updateMany(
            {},
            {
                $set: {
                    deleted: false,
                    submitted: false
                },
                $setOnInsert: {
                    createdBy: firstUser._id
                }
            },
            { upsert: false }
        );

        // Also update tasks that don't have createdBy
        const result2 = await Task.updateMany(
            { createdBy: { $exists: false } },
            { $set: { createdBy: firstUser._id } }
        );

        console.log(`✅ Set deleted/submitted fields: ${result.modifiedCount} tasks`);
        console.log(`✅ Added createdBy field: ${result2.modifiedCount} tasks`);

        // Count all tasks
        const total = await Task.countDocuments({});
        console.log(`\nTotal tasks in database: ${total}`);

        // Show breakdown
        const active = await Task.countDocuments({ deleted: false, submitted: false });
        const deleted = await Task.countDocuments({ deleted: true });
        const submitted = await Task.countDocuments({ submitted: true });

        console.log(`- Active tasks: ${active}`);
        console.log(`- Deleted tasks: ${deleted}`);
        console.log(`- Submitted tasks: ${submitted}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixAllTasks();