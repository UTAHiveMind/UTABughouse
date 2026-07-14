const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
    // Connect to the database using environment variable
    await mongoose.connect(process.env.DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    // Create an admin user with a plain-text password (password will be hashed by the pre-save hook)
    const adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        phone: '1234567890',
        email: 'admin@example.com',
        password: 'adminpassword', // The password will be hashed by the pre-save hook
        role: 'Admin', // Set the role to Admin
    });

    try {
        const savedAdmin = await adminUser.save(); // The password hashing happens here
        console.log('Admin user created:', savedAdmin);
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        mongoose.connection.close(); // Ensure the connection is closed whether successful or not
    }
};

// Execute the function
createAdmin();