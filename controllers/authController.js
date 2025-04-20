// import User from "../models/user.js";
// import { generateToken } from "../utils/jwt.js";
// import bcrypt from "bcryptjs";
// import Student from "../models/student.js";

// export const signup = async (req, res) => {
//   const { name, email, password, phone, role } = req.body;

//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists" });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({
//       name,
//       email,
//       password: hashedPassword,
//       phone,
//       role,
//     });
//     await user.save();
//     if(role === "student"){
//       const student = new Student({
//         user: user._id,
//         name,
//         email,
//       });
//       await student.save();
//       user.student = student._id;
//       await user.save();
//     }

//     const token = generateToken(user._id.toString(), user.role);

//     res.status(201).json({ user, token });
//   } catch (error) {
//     console.log(error)
//     res.status(500).json({ message: error.message });
//   }
// };

// // Login Controller
// export const login = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }
//     const token = generateToken(user._id.toString(), user.role);

//     res.status(200).json({ user, token });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const searchParents = async (req, res) => {
//   const { query } = req.query;

//   try {
//     if (!query || query.length < 2) {
//       return res.status(400).json({ message: "Query must be at least 2 characters" });
//     }

//     const parents = await User.find({
//       role: "parent",
//       $or: [
//         { name: { $regex: query, $options: "i" } },
//         { email: { $regex: query, $options: "i" } },
//       ],
//     })
//       .select("name email")
//       .limit(10);

//     res.status(200).json(parents);
//   } catch (error) {
//     console.error("Error searching parents:", error.message);
//     res.status(500).json({ message: error.message });
//   }
// };

import User from "../models/user.js";
import { generateToken } from "../utils/jwt.js";
import bcrypt from "bcryptjs";
import Student from "../models/student.js";

// Signup Controller (Restricted to Parent and Teacher)
export const signup = async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  const allowedRoles = ["parent", "teacher"];
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ message: "Signup is only allowed for parents and teachers" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
    });

    await user.save();
    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({ user, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Admin-Only Signup Controller
export const adminSignup = async (req, res) => {
  const { name, email, password, phone, role, parentId } = req.body;

  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
    });

    await user.save();

    if (role === "student" && parentId) {
      const parent = await User.findOne({ _id: parentId, role: "parent" });
      if (!parent) {
        return res.status(400).json({ message: "Invalid parent ID" });
      }
      // Optionally create Student here if needed, but prefer studentController
    }

    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({ user, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Login Controller
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isBcryptHash = (storedPassword) => {
      return /^\$2[aby]\$\d{2}\$/.test(storedPassword); // Matches bcrypt hash format
    };

    let isMatch;
    if (isBcryptHash(user.password)) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id.toString(), user.role, user.email);
    res.status(200).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search Parents (Added for frontend parent search)
export const searchParents = async (req, res) => {
  const { query } = req.query;

  try {
    if (!query || query.length < 2) {
      return res.status(400).json({ message: "Query must be at least 2 characters" });
    }

    const parents = await User.find({
      role: "parent",
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("name email")
      .limit(10);

    res.status(200).json(parents);
  } catch (error) {
    console.error("Error searching parents:", error.message);
    res.status(500).json({ message: error.message });
  }
};