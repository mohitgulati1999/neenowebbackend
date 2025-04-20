import Student from "../models/student.js";
import Attendance from "../models/attendance.js";
import CCTV from "../models/cctv.js";
import Class from "../models/class.js"; // Assuming you have a Class model
import mongoose from "mongoose";

// Mark attendance (in or out) for students in a class
export const markAttendance = async (req, res) => {
  console.log("markAttendance INITIATED - body:", req.body, "user:", req.user);

  const { classId, date, attendanceRecords } = req.body; // Array of { studentId, inTime, outTime, notes }
  const userId = req.user.userId; // e.g., "67d928107f0d0482a48c7c50"
  const role = req. user.role; // e.g., "teacher" or "admin"

  try {
    console.log("Step 1: Validating input - classId:", classId, "date:", date);
    if (!classId || !date || !Array.isArray(attendanceRecords)) {
      console.log("Step 1a: Validation failed");
      return res.status(400).json({ message: "Class ID, date, and attendance records are required" });
    }

    // Validate teacher’s access to class (skip for admin)
    const classData = await Class.findById(classId);
    if (!classData) {
      console.log("Step 2: Class not found:", classId);
      return res.status(404).json({ message: "Class not found" });
    }
    if (role !== "admin" && !classData.teacherId.some(id => id.toString() === userId)) {
      console.log("Step 2: Teacher not authorized for class:", classId);
      return res.status(403).json({ message: "You are not authorized to mark attendance for this class" });
    }

    const results = [];
    for (const record of attendanceRecords) {
      const { studentId, inTime, outTime, notes } = record;
      console.log("Step 3: Processing studentId:", studentId);

      const student = await Student.findById(studentId);
      if (!student || student.classId.toString() !== classId) {
        results.push({ studentId, error: "Student not found or not in this class" });
        continue;
      }

      let attendance = await Attendance.findOne({ studentId, date: new Date(date) });
      if (!attendance) {
        attendance = new Attendance({
          studentId,
          classId,
          date: new Date(date),
          markedBy: userId
        });
      }

      if (inTime) attendance.inTime = new Date(inTime);
      if (outTime) attendance.outTime = new Date(outTime);
      if (notes) attendance.notes = notes;

      await attendance.save();
      results.push(attendance);
      console.log("Step 4: Attendance updated for studentId:", studentId, "record:", attendance);
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error in markAttendance:", error.message, "Stack:", error.stack);
    return res.status(500).json({ message: "Server error while marking attendance" });
  }
};

// Get attendance and CCTV for a student (for parents)
export const getStudentAttendanceAndCCTV = async (req, res) => {
  console.log("getStudentAttendanceAndCCTV INITIATED - params:", req.params, "user:", req.user);

  const { studentId, date } = req.params;
  const parentId = req.user.userId; // e.g., "615f8e9b9d1b2c3d4e5f6a7e"
  const role = req.user.role;

  try {
    console.log("Step 1: Input - studentId:", studentId, "date:", date);
    if (!studentId || !date) {
      console.log("Step 1a: Validation failed");
      return res.status(400).json({ message: "Student ID and date are required" });
    }

    // Validate student exists
    const student = await Student.findById(studentId);
    console.log("Step 2: Student query result:", student);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // For parents: Check linkage via email (since no userId in document)
    if (role === "parent") {
      const parentEmail = req.user.email; // e.g., "abc@yahoo.com" from JWT
      if (!parentEmail || !["fatherInfo.email", "motherInfo.email", "guardianInfo.email"].some(field => student[field.split(".")[0]].email === parentEmail)) {
        console.log("Step 3: Parent not linked to student");
        return res.status(403).json({ message: "You are not authorized to view this student’s data" });
      }
    }

    // Get attendance for the date
    const attendance = await Attendance.findOne({
      studentId,
      date: new Date(date)
    });
    console.log("Step 4: Attendance result:", attendance);

    if (!attendance) {
      console.log("Step 4a: No attendance record for date:", date);
      return res.status(404).json({ message: "No attendance record found for this date" });
    }

    const isStudentIn = attendance.isStudentIn();
    console.log("Step 5: Student in premises:", isStudentIn);

    // Get CCTV feeds for the class if student is in
    let cctvFeeds = [];
    if (isStudentIn) {
      cctvFeeds = await CCTV.find({ classId: student.classId, active: true });
      console.log("Step 6: CCTV feeds retrieved:", cctvFeeds);
    }

    return res.status(200).json({
      attendance,
      isStudentIn,
      cctvFeeds: isStudentIn ? cctvFeeds : []
    });
  } catch (error) {
    console.error("Error in getStudentAttendanceAndCCTV:", error.message, "Stack:", error.stack);
    return res.status(500).json({ message: "Server error while fetching attendance and CCTV" });
  }
};

// Get all students in a class for attendance marking (for teachers)
export const getClassStudentsForAttendance = async (req, res) => {
  console.log("getClassStudentsForAttendance INITIATED - params:", req.params, "user:", req.user);

  const { classId, date } = req.params;
  const userId = req.user.userId;
  const role = req.user.role;

  try {
    console.log("Step 1: Input - classId:", classId, "date:", date);
    if (!classId || !date) {
      console.log("Step 1a: Validation failed");
      return res.status(400).json({ message: "Class ID and date are required" });
    }

    // Validate class exists
    const classData = await Class.findById(classId);
    if (!classData) {
      console.log("Step 2: Class not found:", classId);
      return res.status(404).json({ message: "Class not found" });
    }

    // Restrict teachers to their assigned classes; admins bypass this check
    if (role !== "admin" && !classData.teacherId.some(id => id.toString() === userId)) {
      console.log("Step 2: Teacher not authorized for class:", classId);
      return res.status(403).json({ message: "You are not authorized for this class" });
    }

    // Get all students in the class
    const students = await Student.find({ classId }).select("admissionNumber name rollNumber");
    console.log("Step 3: Students in class:", students.length);
    console.log("Step 3a: Raw student data:", students);

    // Get attendance records for the date
    const attendanceRecords = await Attendance.find({
      classId,
      date: new Date(date),
    });

    // Map students to include attendance data
    const studentAttendance = students.map(student => {
      const attendance = attendanceRecords.find(a => a.studentId.toString() === student._id.toString());
      return {
        id: student._id,
        admissionNo: student.admissionNumber || "N/A",
        name: student.name,
        rollNo: student.rollNumber || "N/A",
        inTime: attendance ? attendance.inTime : null,
        outTime: attendance ? attendance.outTime : null,
      };
    });

    console.log("Step 4: Prepared attendance list:", studentAttendance);
    return res.status(200).json(studentAttendance);
  } catch (error) {
    console.error("Error in getClassStudentsForAttendance:", error.message, "Stack:", error.stack);
    return res.status(500).json({ message: "Server error while fetching class students" });
  }
};

// Get attendance for a student over a period
export const getStudentAttendanceByPeriod = async (req, res) => {
  console.log("getStudentAttendanceByPeriod INITIATED - params:", req.params, "query:", req.query, "user:", req.user);

  const { studentId } = req.params;
  const { startDate, endDate } = req.query; // e.g., "2024-01-01", "2024-12-31"
  const { userId, role, email } = req.user;

  try {
    // Step 1: Validate input
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      console.log("Step 1a: Invalid studentId format:", studentId);
      return res.status(400).json({ message: "Invalid student ID format" });
    }
    if (!startDate || !endDate) {
      console.log("Step 1b: Missing date parameters");
      return res.status(400).json({ message: "startDate and endDate are required" });
    }

    // Parse and normalize dates
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.log("Step 1c: Invalid date format - startDate:", startDate, "endDate:", endDate);
      return res.status(400).json({ message: "Invalid date format" });
    }
    if (end < start) {
      console.log("Step 1d: endDate is before startDate");
      return res.status(400).json({ message: "endDate cannot be earlier than startDate" });
    }

    // Step 2: Validate student exists
    const student = await Student.findById(studentId);
    console.log("Step 2: Student query result:", student);
    if (!student) {
      console.log("Step 2a: Student not found for ID:", studentId);
      return res.status(404).json({ message: "Student not found" });
    }

    // Step 3: Authorization check for parents
    if (role === "parent") {
      const parentEmail = email;
      if (
        !parentEmail ||
        !["fatherInfo.email", "motherInfo.email", "guardianInfo.email"].some(
          (field) => student[field.split(".")[0]]?.email === parentEmail
        )
      ) {
        console.log("Step 3: Parent not linked to student - email:", parentEmail);
        return res.status(403).json({ message: "You are not authorized to view this student’s data" });
      }
    }

    // Step 4: Fetch attendance records
    const attendanceRecords = await Attendance.find({
      studentId: new mongoose.Types.ObjectId(studentId),
      date: {
        $gte: start,
        $lte: end,
      },
    })
      .select("date inTime outTime notes")
      .lean();

    console.log(
      "Step 4: Attendance records retrieved:",
      attendanceRecords.length,
      "records:",
      attendanceRecords
    );

    if (attendanceRecords.length === 0) {
      console.log(
        "Step 4a: No attendance records found for studentId:",
        studentId,
        "date range:",
        start.toISOString(),
        "to",
        end.toISOString()
      );
    }

    return res.status(200).json(attendanceRecords);
  } catch (error) {
    console.error("Error in getStudentAttendanceByPeriod:", error.message, "Stack:", error.stack);
    return res.status(500).json({ message: "Server error while fetching attendance", error: error.message });
  }
};