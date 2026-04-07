const authService = require('../services/authService');

exports.signup = async (req, res) => {
  try {
    const user = await authService.registerAdmin(req.body);
    res.status(201).json({ message: "Admin created successfully", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await authService.loginAdmin(email, password);
    res.status(200).json(data);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};