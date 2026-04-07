const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerAdmin = async (userData) => {
    const { email, password, name, restaurantName } = userData;

    // Check if admin exists
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('Admin already exists');

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
        name,
        restaurantName,
        email,
        password: hashedPassword
    });
    const user = await newUser.save();
    // Generate JWT
    const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    return { token, success: true }
};

const loginAdmin = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    // Generate JWT
    const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    return { token, success: true, user: { id: user._id, name: user.name, role: user.role } };
};

module.exports = { registerAdmin, loginAdmin };