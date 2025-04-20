// // controllers/Class.js
// import mongoose from "mongoose";
// import Class from "../models/class.js";
// import Session from "../models/session.js";
// import Teacher from "../models/teacher.js";

// // Get all classes
// export const getAllClasses = async (req, res) => {
//   try {
//     const classes = await Class.find()
//       .populate("sessionId", "name sessionId") // Populate session details
//       .populate("teacherId", "name"); // Populate teacher names
//     res.status(200).json(classes);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Create a new class
// export const createClass = async (req, res) => {
//   try {
//     const { id, name, teacherId, sessionId } = req.body;

//     // Validate required fields
//     if (!id || !name || !teacherId || !sessionId) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     // Check if session exists
//     const sessionExists = await Session.findById(sessionId);
//     if (!sessionExists) {
//       return res.status(404).json({ message: "Session not found" });
//     }

//     // Check if teachers exist
//     const teachersExist = await Teacher.find({ _id: { $in: teacherId } });
//     if (teachersExist.length !== teacherId.length) {
//       return res.status(404).json({ message: "One or more teachers not found" });
//     }

//     // Check if class ID already exists
//     const classExists = await Class.findOne({ id });
//     if (classExists) {
//       return res.status(400).json({ message: "Class ID already exists" });
//     }

//     const newClass = new Class({
//       id,
//       name,
//       teacherId,
//       sessionId,
//     });

//     const savedClass = await newClass.save();
//     res.status(201).json(savedClass);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// // Get class by ID (user-entered ID or MongoDB _id)
// export const getClassById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     let classData;

//     // Check if the param is a valid MongoDB ObjectId
//     if (mongoose.Types.ObjectId.isValid(id)) {
//       classData = await Class.findById(id)
//         .populate("sessionId", "name sessionId")
//         .populate("teacherId", "name");
//     } else {
//       // Otherwise, search by user-entered id
//       classData = await Class.findOne({ id })
//         .populate("sessionId", "name sessionId")
//         .populate("teacherId", "name");
//     }

//     if (!classData) {
//       return res.status(404).json({ message: "Class not found" });
//     }
//     res.status(200).json(classData);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Update a class
// export const updateClass = async (req, res) => {
//   try {
//     const { id, name, teacherId, sessionId } = req.body;

//     // Validate session if provided
//     if (sessionId) {
//       const sessionExists = await Session.findById(sessionId);
//       if (!sessionExists) {
//         return res.status(404).json({ message: "Session not found" });
//       }
//     }

//     // Validate teachers if provided
//     if (teacherId) {
//       const teachersExist = await Teacher.find({ _id: { $in: teacherId } });
//       if (teachersExist.length !== teacherId.length) {
//         return res.status(404).json({ message: "One or more teachers not found" });
//       }
//     }

//     // Check if the new id (if provided) is already taken by another class
//     if (id) {
//       const existingClassWithId = await Class.findOne({ id });
//       if (existingClassWithId && existingClassWithId._id.toString() !== req.params.id) {
//         return res.status(400).json({ message: "Class ID already exists" });
//       }
//     }

//     const updatedClass = await Class.findByIdAndUpdate(
//       req.params.id,
//       { id, name, teacherId, sessionId },
//       { new: true, runValidators: true }
//     );

//     if (!updatedClass) {
//       return res.status(404).json({ message: "Class not found" });
//     }

//     res.status(200).json(updatedClass);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// // Delete a class
// export const deleteClass = async (req, res) => {
//   try {
//     const deletedClass = await Class.findByIdAndDelete(req.params.id);
//     if (!deletedClass) {
//       return res.status(404).json({ message: "Class not found" });
//     }
//     res.status(200).json({ message: "Class deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Get all classes for a specific session
// export const getClassesBySession = async (req, res) => {
//   try {
//     const { sessionId } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(sessionId)) {
//       return res.status(400).json({ message: "Invalid session ID" });
//     }

//     const classes = await Class.find({ sessionId })
//       .populate("teacherId", "name");
//     if (classes.length === 0) {
//       return res.status(404).json({ message: "No classes found for this session" });
//     }
//     res.status(200).json(classes);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// controllers/Class.js
import mongoose from "mongoose";
import Class from "../models/class.js";
import Session from "../models/session.js";
import Teacher from "../models/teacher.js";
import User from "../models/user.js";
// Get all classes
export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("sessionId", "name sessionId") 
      .populate("teacherId", "name");
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new class
export const createClass = async (req, res) => {
  try {
    const { id, name, teacherId, sessionId } = req.body;
    console.log("Received request body:", req.body);

    if (!id || !name || !teacherId || !sessionId) {
      console.warn("Missing required fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    const sessionExists = await Session.findById(sessionId);
    console.log("Session lookup result:", sessionExists);
    if (!sessionExists) {
      console.warn("Session not found for ID:", sessionId);
      return res.status(404).json({ message: "Session not found" });
    }

    const teachersExist = await User.find({
      _id: { $in: teacherId },
      role: "teacher"
    });
    console.log("Teachers found:", teachersExist);

    if (teachersExist.length !== teacherId.length) {
      console.warn("Mismatch in teacher count. Sent:", teacherId.length, "Found:", teachersExist.length);
      return res.status(404).json({ message: "One or more teachers not found" });
    }

    const classExists = await Class.findOne({ id });
    console.log("Class existence check:", classExists);
    if (classExists) {
      console.warn("Class with ID already exists:", id);
      return res.status(400).json({ message: "Class ID already exists" });
    }

    const newClass = new Class({
      id,
      name,
      teacherId,
      sessionId,
    });

    const savedClass = await newClass.save();
    console.log("New class saved successfully:", savedClass);
    res.status(201).json(savedClass);
  } catch (error) {
    console.error("Error while creating class:", error);
    res.status(400).json({ message: error.message });
  }
};

// Get class by ID (user-entered ID or MongoDB _id)
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    let classData;
    // if (mongoose.Types.ObjectId.isValid(id)) {
    //   classData = await Class.findById(id)
    //     .populate("sessionId", "name sessionId")
    //     .populate("teacherId", "name");
    // } else {
    //   classData = await Class.findOne({ id })
    //     .populate("sessionId", "name sessionId")
    //     .populate("teacherId", "name");
    // }
    if (mongoose.Types.ObjectId.isValid(id)) {
      classData = await Class.findById(id)
        .populate("sessionId", "name sessionId")
        .populate("teacherId", "name email"); // Updated to populate from User
    } else {
      classData = await Class.findOne({ id })
        .populate("sessionId", "name sessionId")
        .populate("teacherId", "name email"); // Updated to populate from User
    }

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.status(200).json(classData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a class
export const updateClass = async (req, res) => {
  try {
    const { id, name, teacherId, sessionId } = req.body;
    if (sessionId) {
      const sessionExists = await Session.findById(sessionId);
      if (!sessionExists) {
        return res.status(404).json({ message: "Session not found" });
      }
    }
    if (teacherId) {
      // const teachersExist = await Teacher.find({ _id: { $in: teacherId } });
      const teachersExist = await User.find({ 
        _id: { $in: teacherId }, 
        role: "teacher" 
      });
      if (teachersExist.length !== teacherId.length) {
        return res.status(404).json({ message: "One or more teachers not found" });
      }
    }
    if (id) {
      const existingClassWithId = await Class.findOne({ id });
      if (existingClassWithId && existingClassWithId._id.toString() !== req.params.id) {
        return res.status(400).json({ message: "Class ID already exists" });
      }
    }

    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      { id, name, teacherId, sessionId },
      { new: true, runValidators: true }
    );

    if (!updatedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json(updatedClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a class
export const deleteClass = async (req, res) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    if (!deletedClass) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.status(200).json({ message: "Class deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all classes for a specific session
export const getClassesBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    const classes = await Class.find({ sessionId })
      .populate("teacherId", "name email");
    if (classes.length === 0) {
      return res.status(404).json({ message: "No classes found for this session" });
    }
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getClassesForTeacher = async (req, res) => {
  try {
    console.log("Starting getClassesForTeacher function...");

    // Log the entire req.user object to inspect its structure
    console.log("req.user:", JSON.stringify(req.user, null, 2));

    // Extract teacherId and log it
    const teacherId = req.user.userId; // Changed from req.user.id to req.user.userId based on your update
    console.log("Extracted teacherId:", teacherId);

    // Validate teacherId
    if (!teacherId) {
      console.log("teacherId is undefined or null");
      return res.status(400).json({ message: "Teacher ID is missing from request user" });
    }

    // Log the query being executed
    console.log("Executing Class.find with query:", { teacherId: { $in: [teacherId] } });

    // Find classes and log the raw result
    const classes = await Class.find({ teacherId: { $in: [teacherId] } });
    console.log("Raw classes from database:", JSON.stringify(classes, null, 2));

    // Log before population
    console.log("Populating sessionId and teacherId...");

    // Populate sessionId and teacherId
    const populatedClasses = await Class.find({ teacherId: { $in: [teacherId] } })
      .populate("sessionId", "name sessionId")
      .populate("teacherId", "name email");
    console.log("Populated classes:", JSON.stringify(populatedClasses, null, 2));

    // Check if any classes were found
    if (populatedClasses.length === 0) {
      console.log("No classes found for teacherId:", teacherId);
      return res.status(404).json({ message: "No classes found for this teacher" });
    }

    // Log successful response
    console.log("Classes found, sending response:", populatedClasses.length, "classes");
    res.status(200).json(populatedClasses);
  } catch (error) {
    // Log the error details
    console.error("Error in getClassesForTeacher:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error object:", JSON.stringify(error, null, 2));

    // Send error response
    res.status(500).json({ message: error.message });
  }
};