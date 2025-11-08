// api/admin-logout.js
module.exports = async (req, res) => {
  return res.status(200).json({ ok: true, message: 'Logged out' });
};

