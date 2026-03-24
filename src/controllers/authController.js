import User from "../models/User.js";
import Purchase from "../models/Purchase.js";
import ServiceProvider from "../models/ServiceProvider.js";
import { generateToken } from "../middleware/auth.js";

import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { email, password, role, name, cnicNumber, phoneNumber, fatherName } =
      req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    } // fine

    let purchaserId = null;
    let serviceProviderId = null;
    let token;
    let imageUri = null;

    if (req.files && req.files.image) {
      imageUri = `uploads/image/${req.files.image[0].filename}`;
    }

    if (role === "purchaser" || !role) {
      const purchase = await Purchase.create({
        name,
        cnicNumber,
        phoneNumber,
        fatherName,
        balance: 0,
        imageUri,
      });
      purchaserId = purchase._id;
      token = generateToken(purchase._id);

      if (!token) {
        res.status(500).json({
          success: false,
          error: error.message,
          message: "Token not generated",
        });
        return;
      }
    } else if (role === "service_provider") {
      const serviceProvider = await ServiceProvider.create({
        name,
        cnicNumber,
        phoneNumber,
        balance: 0,
        imageUri,
      });
      serviceProviderId = serviceProvider._id;
      token = generateToken(serviceProvider._id);

      if (!token) {
        res.status(500).json({
          success: false,
          error: error.message,
          message: "Token not generated",
        });
        return;
      }
    }

    const user = await User.create({
      email,
      password,
      role: role || "purchaser",
      purchaserId: purchaserId || null,
      serviceProviderId: serviceProviderId || null,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        role: user.role,
        purchaserId: user.purchaserId || null,
        serviceProviderId: user.serviceProviderId || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        role: user.role,
        purchaserId: user.purchaserId,
        serviceProviderId: user.serviceProviderId,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ success: true, message: "Logged out successfully" });
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("purchaserId")
      .populate("serviceProviderId");

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = generateToken(req.user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
