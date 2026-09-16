const { User, RefreshToken } = require("../models");
const jwtUtil = require("../utils/jwt");

exports.register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, deviceIp } = req.body;
    if (!email || !password || !fullName)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    const exists = await User.findOne({ where: { email } });
    if (exists)
      return res
        .status(400)
        .json({ success: false, message: "Email already used" });
    const user = await User.create({
      fullName,
      email,
      phone,
      password,
      deviceIp,
    });
    res.json({
      success: true,
      message: "Registered",
      data: { id: user.id, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, deviceIp } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    if (user.status === "locked")
      return res
        .status(403)
        .json({ success: false, message: "Account locked" });
    const valid = await user.validatePassword(password);
    if (!valid)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    // Optionally enforce single device IP per account
    if (user.deviceIp && deviceIp && user.deviceIp !== deviceIp) {
      return res
        .status(403)
        .json({ success: false, message: "Device IP mismatch" });
    }
    if (!user.deviceIp && deviceIp) {
      user.deviceIp = deviceIp;
      await user.save();
    }

    const accessToken = jwtUtil.signAccessToken({
      id: user.id,
      role: user.role,
    });
    const refreshToken = jwtUtil.signRefreshToken({ id: user.id });
    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: jwtUtil.getRefreshExpiryDate(),
    });

    res.json({
      success: true,
      message: "Logged in",
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ success: false, message: "No token" });
    const stored = await RefreshToken.findOne({
      where: { token: refreshToken },
    });
    if (!stored)
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    const payload = jwtUtil.verifyRefreshToken(refreshToken);
    const accessToken = jwtUtil.signAccessToken({
      id: payload.id,
      role: payload.role,
    });
    res.json({ success: true, message: "", data: { accessToken } });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken)
      await RefreshToken.destroy({ where: { token: refreshToken } });
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
};
