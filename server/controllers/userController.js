const User = require('../models/User');

// Get user by name (Maverick, Bell, or Goju)
const getUserByName = async (req, res) => {
  try {
    const { name } = req.params;
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    const user = await User.findOne({ name: formattedName });

    if (!user) {
      return res.status(404).json({ message: `${formattedName} not found` });
    }

    res.json({
      message: `${formattedName} dashboard ready`,
      user: {
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getUserByName };
