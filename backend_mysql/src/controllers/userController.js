const { createUser, getUsers, softDeleteSelf, hardDeleteSelf, hardDeleteUser } = require('../services/userService');

exports.create = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password and role are required.' });
    }
    const user = await createUser({ name, email, password, role, createdBy: req.user.userId });
    res.status(201).json({ success: true, user });
  } catch (error) {
    const status = error.message.includes('cannot assign') || error.message.includes('not permitted') ? 403 : 400;
    res.status(status).json({ error: error.message });
  }
};

exports.list = async (req, res) => {
  try {
    const users = await getUsers({ createdBy: req.user.userId, creatorRole: req.user.role });
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/users/me
// - admin  → hard delete (all data wiped)
// - others → blocked (only admin can delete their own account)
exports.selfDelete = async (req, res) => {
  try {
    const role = req.user.role;

    if (role !== 'admin') {
      return res.status(403).json({
        error: 'Only admin accounts can delete themselves. Contact your admin to remove your account.'
      });
    }

    await hardDeleteSelf(req.user.userId);
    res.json({ success: true, message: 'Your account and all associated data have been permanently deleted.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE /api/users/:id — hard delete a sub-user + all their data (admin/manager only)
exports.hardDelete = async (req, res) => {
  try {
    await hardDeleteUser({
      targetId: Number(req.params.id),
      deleterId: req.user.userId,
      deleterRole: req.user.role,
    });
    res.json({ success: true, message: 'User and all associated data permanently deleted.' });
  } catch (error) {
    const status = error.message.includes('only delete') || error.message.includes('cannot be deleted') ? 403 : 404;
    res.status(status).json({ error: error.message });
  }
};
