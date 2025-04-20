import Student from "../models/student.js";
import Class from "../models/class.js"; // Assuming this model exists
import Session from "../models/session.js"; // Import Session model
import Teacher from "../models/teacher.js";
import mongoose from "mongoose";
// Get all students
// export const getAllStudents = async (req, res) => {
//   try {
//     const students = await Student.find()
//       .select("name admissionNumber admissionDate status sessionId classId rollNumber profileImage dateOfBirth gender bloodGroup religion category motherTongue languagesKnown fatherInfo motherInfo guardianInfo currentAddress permanentAddress transportInfo documents medicalHistory previousSchool")
//       .populate("sessionId", "name sessionId")
//       .populate("classId", "name id");

//     if (students.length > 0) console.log("Got all students");
//     res.status(200).json(students);
//   } catch (error) {
//     console.error("Error fetching students:", error.message);
//     res.status(500).json({ message: error.message });
//   }
// };
export const getAllStudents = async (req, res) => {
  try {
    const { role, userId } = req.user; // Extracted from JWT by auth middleware
    let students;

    if (role === "teacher") {
      // Find classes where the teacher's User._id is in teacherId array
      const classes = await Class.find({ teacherId: userId }).select("_id");
      if (!classes || classes.length === 0) {
        console.log("No classes assigned to teacher:", userId);
        return res.status(404).json({ message: "No classes assigned to this teacher" });
      }

      // Extract classIds
      const classIds = classes.map((cls) => cls._id);

      // Fetch students in the teacher's classes
      students = await Student.find({ classId: { $in: classIds } })
        .select(
          "name admissionNumber admissionDate status sessionId classId rollNumber profileImage dateOfBirth gender bloodGroup religion category motherTongue languagesKnown fatherInfo motherInfo guardianInfo currentAddress permanentAddress transportInfo documents medicalHistory previousSchool"
        )
        .populate("sessionId", "name sessionId")
        .populate("classId", "name id");

      console.log(`Fetched ${students.length} students for teacher's classes:`, classIds);
    } else if (role === "admin") {
      // Fetch all students for admin
      students = await Student.find()
        .select(
          "name admissionNumber admissionDate status sessionId classId rollNumber profileImage dateOfBirth gender bloodGroup religion category motherTongue languagesKnown fatherInfo motherInfo guardianInfo currentAddress permanentAddress transportInfo documents medicalHistory previousSchool"
        )
        .populate("sessionId", "name sessionId")
        .populate("classId", "name id");

      console.log(`Fetched ${students.length} students for admin`);
    } else {
      console.log("Unauthorized role:", role);
      return res.status(403).json({ message: "Unauthorized role" });
    }

    if (students.length === 0) {
      console.log("No students found for role:", role);
      return res.status(200).json([]);
    }

    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error.message);
    res.status(500).json({ message: error.message });
  }
};


// Get student by admissionNumber
export const getStudentById = async (req, res) => {
  try {
    const { admissionNumber } = req.params;
    const student = await Student.findOne({ admissionNumber })
      .populate("sessionId", "name sessionId")
      .populate("classId", "name id");

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get students by filter
export const getStudentByFilter = async (req, res) => {
  try {
    const students = await Student.find(req.body)
      .select("name admissionNumber academicYear dateOfBirth gender status sessionId classId rollNumber")
      .populate("sessionId", "name sessionId")
      .populate("classId", "name id");

    res.status(200).json(students);
  } catch (error) {
    console.error("Error filtering students:", error.message);
    res.status(500).json({ message: error.message });
  }
};
export const getStudentByAdmissionNumber = async (req, res) => {
  try {
    const { admissionNumber } = req.params;
    const student = await Student.findOne({ admissionNumber }).select("_id classId");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Create a new student (Admin only)
export const createStudent = async (req, res) => {
  const {
    academicYear,
    admissionNumber,
    admissionDate,
    status,
    sessionId,
    classId,
    rollNumber,
    name,
    dateOfBirth,
    gender,
    bloodGroup,
    religion,
    category,
    motherTongue,
    languagesKnown,
    fatherInfo,
    motherInfo,
    guardianInfo,
    currentAddress,
    permanentAddress,
    transportInfo,
    medicalHistory,
    previousSchool,
  } = req.body;

  try {
    // Check if admissionNumber is unique
    const existingStudent = await Student.findOne({ admissionNumber });
    if (existingStudent) {
      return res.status(400).json({ message: "Admission number already exists" });
    }

    // Validate sessionId
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    // Validate classId and rollNumber if provided
    if (classId) {
      const classExists = await Class.findById(classId);
      if (!classExists) {
        return res.status(400).json({ message: "Invalid class ID" });
      }
      if (classExists.sessionId.toString() !== sessionId.toString()) {
        return res.status(400).json({ message: "Class does not belong to the specified session" });
      }
      if (rollNumber) {
        const rollNumberTaken = await Student.findOne({ classId, rollNumber });
        if (rollNumberTaken) {
          return res.status(400).json({ message: "Roll number already taken in this class" });
        }
      }
    }

    const newStudent = new Student({
      // academicYear,
      admissionNumber,
      admissionDate,
      status: status || "active",
      sessionId,
      classId: classId || null,
      rollNumber: rollNumber || null,
      name,
      dateOfBirth,
      gender,
      bloodGroup,
      religion,
      category,
      motherTongue,
      languagesKnown,
      fatherInfo,
      motherInfo,
      guardianInfo,
      currentAddress,
      permanentAddress,
      transportInfo,
      medicalHistory,
      previousSchool,
    });

    const response = await newStudent.save();
    console.log("Student created successfully");
    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating student:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Update student (Admin only)
export const updateStudent = async (req, res) => {
  try {
    const { admissionNumber } = req.params;
    const {
      admissionNumber: newAdmissionNumber,
      sessionId,
      classId,
      rollNumber,
      ...updateData
    } = req.body;

    // Check if new admissionNumber is unique (if changed)
    if (newAdmissionNumber && newAdmissionNumber !== admissionNumber) {
      const existingStudent = await Student.findOne({ admissionNumber: newAdmissionNumber });
      if (existingStudent) {
        return res.status(400).json({ message: "Admission number already exists" });
      }
    }

    // Validate sessionId if provided
    if (sessionId) {
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
    }

    // Validate classId and rollNumber if provided
    if (classId) {
      const classExists = await Class.findById(classId);
      if (!classExists) {
        return res.status(400).json({ message: "Invalid class ID" });
      }
      if (sessionId && classExists.sessionId.toString() !== sessionId.toString()) {
        return res.status(400).json({ message: "Class does not belong to the specified session" });
      }
      if (rollNumber) {
        const rollNumberTaken = await Student.findOne({
          classId,
          rollNumber,
          admissionNumber: { $ne: admissionNumber },
        });
        if (rollNumberTaken) {
          return res.status(400).json({ message: "Roll number already taken in this class" });
        }
      }
    }

    const updatedStudent = await Student.findOneAndUpdate(
      { admissionNumber },
      { 
        ...updateData, 
        admissionNumber: newAdmissionNumber || admissionNumber, 
        sessionId, 
        classId, 
        rollNumber 
      },
      { new: true }
    )
      .populate("sessionId", "name sessionId")
      .populate("classId", "name id");

    if (!updatedStudent) return res.status(404).json({ message: "Student not found" });
    console.log("Updated student");
    res.status(200).json(updatedStudent);
  } catch (error) {
    console.error("Error updating student:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Delete student by admissionNumber (Admin only)
export const deleteStudent = async (req, res) => {
  try {
    const { admissionNumber } = req.params;
    const deletedStudent = await Student.findOneAndDelete({ admissionNumber });
    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    console.log("Student deleted successfully");
    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get students by class and session
export const getStudentsByClassAndSession = async (req, res) => {
  try {
    const { classId, sessionId } = req.params;

    // Validate classId and sessionId format
    if (!mongoose.Types.ObjectId.isValid(classId) || 
        !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid class or session ID format" });
    }

    // Check if the class exists in the specified session
    const classExists = await Class.findOne({ 
      _id: classId, 
      sessionId: sessionId 
    });

    if (!classExists) {
      return res.status(404).json({ 
        message: "Class not found in the specified session" 
      });
    }

    // Find students in this class and session
    const students = await Student.find({ 
      classId: classId, 
      sessionId: sessionId 
    })
    .select("name admissionNumber rollNumber gender category profileImage classId")
    .sort({ rollNumber: 1 }); // Sort by roll number

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error("Error fetching students by class and session:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching students",
      error: error.message 
    });
  }
};