// import User from '../models/user.js'
// import Homework from "../models/homework.js";
// import Student from "../models/student.js";
// import mongoose from "mongoose";
// import Class from '../models/class.js'
// export const getHomework = async (req, res) => {
//   try {
//     const { role, email, userId } = req.user; // Extract role, email, and userId from JWT payload
//     let homework = [];

//     if (role === "parent") {
//       // Parent: Get homework for their children's classes
//       const children = await Student.find({
//         $or: [
//           { "fatherInfo.email": email },
//           { "motherInfo.email": email },
//         ],
//       }).select("classId");

//       if (!children.length) {
//         return res.status(404).json({ message: "No children found for this parent" });
//       }

//       const classIds = children.map((child) => child.classId);
//       homework = await Homework.find({ classId: { $in: classIds } })
//         .populate("classId", "name")
//         .populate("teacherId", "name email")
//         .sort({ createdAt: -1 });

//     } else if (role === "admin") {
//       // Admin: Get all homework across all classes
//       homework = await Homework.find()
//         .populate("classId", "name")
//         .populate("teacherId", "name email")
//         .sort({ createdAt: -1 });

//     } else if (role === "teacher") {
//       // Teacher: Get homework for their assigned classes
//       const classes = await Class.find({ teacherId: userId }).select("_id");
//       const classIds = classes.map((cls) => cls._id);
      
//       if (!classIds.length) {
//         return res.status(404).json({ message: "No classes assigned to this teacher" });
//       }

//       homework = await Homework.find({ classId: { $in: classIds } })
//         .populate("classId", "name")
//         .populate("teacherId", "name email")
//         .sort({ createdAt: -1 });

//     } else {
//       return res.status(403).json({ message: "Unauthorized role" });
//     }

//     if (!homework.length) {
//       return res.status(404).json({ message: "No homework found" });
//     }

//     res.json(homework);
//   } catch (error) {
//     console.error("Error in getHomework:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// export const addHomework = async (req, res) => {
//   try {
//     const { userId, role, email } = req.user; // Adjusted destructuring
//     if (role !== "teacher") {
//       return res.status(403).json({ message: "Access denied. Only teachers can add homework." });
//     }

//     const { title, subject, description, dueDate, classId } = req.body;
//     if (!title || !subject || !description || !dueDate || !classId) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     // Fetch the teacher's name from the User collection using userId
//     const teacher = await User.findById(userId).select("name");
//     if (!teacher || !teacher.name) {
//       return res.status(400).json({ message: "Teacher name not found in user profile" });
//     }
//     const teacherName = teacher.name;

//     const newHomework = new Homework({
//       title,
//       subject,
//       description,
//       teacherId: userId, // Use userId instead of _id
//       teacherName,
//       dueDate,
//       classId,
//     });

//     await newHomework.save();
//     res.status(201).json({ message: "Homework added successfully", homework: newHomework });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

import User from '../models/user.js';
import Homework from "../models/homework.js";
import Student from "../models/student.js";
import mongoose from "mongoose";
import Class from '../models/class.js';

export const getHomework = async (req, res) => {
  try {
    const { role, email, userId } = req.user; // Extract role, email, and userId from JWT payload
    let homework = [];

    if (role === "parent") {
      // Parent: Get homework for their children's classes
      const children = await Student.find({
        $or: [
          { "fatherInfo.email": email },
          { "motherInfo.email": email },
        ],
      }).select("classId");

      if (!children.length) {
        return res.status(404).json({ message: "No children found for this parent" });
      }

      const classIds = children.map((child) => child.classId);
      homework = await Homework.find({ classId: { $in: classIds } })
        .populate("classId", "name")
        .populate("teacherId", "name email")
        .sort({ createdAt: -1 });

    } else if (role === "admin") {
      // Admin: Get all homework or filter by classId if provided
      const query = req.query.classId ? { classId: req.query.classId } : {};
      console.log("Admin query:", req.query); // Debug log
      homework = await Homework.find(query)
        .populate("classId", "name")
        .populate("teacherId", "name email")
        .sort({ createdAt: -1 });

    } else if (role === "teacher") {
      // Teacher: Get homework for their assigned classes
      const classes = await Class.find({ teacherId: userId }).select("_id");
      const classIds = classes.map((cls) => cls._id);
      
      if (!classIds.length) {
        return res.status(404).json({ message: "No classes assigned to this teacher" });
      }

      homework = await Homework.find({ classId: { $in: classIds } })
        .populate("classId", "name")
        .populate("teacherId", "name email")
        .sort({ createdAt: -1 });

    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    if (!homework.length) {
      return res.status(404).json({ message: "No homework found" });
    }

    res.json(homework);
  } catch (error) {
    console.error("Error in getHomework:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addHomework = async (req, res) => {
  try {
    const { userId, role, email } = req.user; // Adjusted destructuring
    console.log("addHomework request body:", req.body); // Debug log

    const { title, subject, description, dueDate, classId } = req.body;
    if (!title || !subject || !description || !dueDate || !classId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Fetch the teacher's name from the User collection using userId
    const teacher = await User.findById(userId).select("name");
    if (!teacher || !teacher.name) {
      return res.status(400).json({ message: "Teacher name not found in user profile" });
    }
    const teacherName = teacher.name;

    const newHomework = new Homework({
      title,
      subject,
      description,
      teacherId: userId, // Use userId instead of _id
      teacherName,
      dueDate,
      classId,
    });

    await newHomework.save();
    res.status(201).json({ message: "Homework added successfully", homework: newHomework });
  } catch (error) {
    console.error("Error in addHomework:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const editHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, description, dueDate, classId } = req.body;
    const { userId, role } = req.user; // From JWT payload

    console.log("editHomework request body:", req.body); // Debug log

    // Find the homework
    const homework = await Homework.findById(id);
    if (!homework) {
      return res.status(404).json({ message: "Homework not found" });
    }

    // Check permissions: Admin or the teacher who created the homework
    if (role !== "admin" && homework.teacherId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized to edit this homework" });
    }

    // Validate classId if provided
    if (classId) {
      const classExists = await Class.findById(classId);
      if (!classExists) {
        return res.status(400).json({ message: "Invalid class ID" });
      }
    }

    // Update homework fields
    homework.title = title || homework.title;
    homework.subject = subject || homework.subject;
    homework.description = description || homework.description;
    homework.dueDate = dueDate || homework.dueDate;
    if (classId) homework.classId = classId;

    await homework.save();

    // Populate classId and teacherId for response
    const updatedHomework = await Homework.findById(id)
      .populate("classId", "name")
      .populate("teacherId", "name email");

    res.json(updatedHomework);
  } catch (error) {
    console.error("Error in editHomework:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user; // From JWT payload

    // Find the homework
    const homework = await Homework.findById(id);
    if (!homework) {
      return res.status(404).json({ message: "Homework not found" });
    }

    // Check permissions: Admin or the teacher who created the homework
    if (role !== "admin" && homework.teacherId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized to delete this homework" });
    }

    // Delete the homework
    await Homework.findByIdAndDelete(id);

    res.json({ message: "Homework deleted successfully" });
  } catch (error) {
    console.error("Error in deleteHomework:", error);
    res.status(500).json({ message: "Server error" });
  }
};