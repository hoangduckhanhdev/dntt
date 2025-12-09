const User = require("../../models/User");
const bcrypt = require("bcryptjs");
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id; 
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "Admin not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error });
  }
};
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { name, email, phone, address, avatar, birthday, password } = req.body;
    const updateData = {
      name,
      email,
      phone,
      address,
      avatar,
      birthday,
    };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const updated = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!updated) return res.status(404).json({ message: "Admin not found" });
    res.status(200).json(updated);
  } catch (error) {
    console.error(" Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile", error });
  }
};
