const { createUser, getUsers, deleteUser } = require('../services/userService');

exports.create = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password and role are required' });
    }
    const user = await createUser({
      name,
      email,
      password,
      role,
      createdBy: req.user.userId,
    });
    res.status(201).json({ success: true, user });
  } catch (error) {
    const status = error.message.includes('cannot create') || error.message.includes('not permitted') ? 403 : 400;
    res.status(status).json({ error: error.message });
  }
};

exports.list = async (req, res) => {
  try {
    const users = await getUsers({
      createdBy: req.user.userId,
      creatorRole: req.user.role,
    });
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await deleteUser({
      targetId: Number(req.params.id),
      deleterId: req.user.userId,
      deleterRole: req.user.role,
    });
    res.json({ success: true });
  } catch (error) {
    const status = error.message.includes('only delete') ? 403 : 404;
    res.status(status).json({ error: error.message });
  }
};
