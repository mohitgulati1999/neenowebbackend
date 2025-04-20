import Leave from "../models/leave.js";
import Student from "../models/student.js";
import User from "../models/user.js";
import Class from "../models/class.js"
export const applyLeave = async (req, res) => {
  try {
    const { userId, role, email } = req.user;
    const { reason, startDate, endDate } = req.body;

    if (role !== "parent") {
      return res.status(403).json({ message: "Only parents can apply for leave." });
    }

    // Validate required fields
    if (!reason || !reason.title || !reason.message || !startDate || !endDate) {
      return res.status(400).json({ message: "Title, message, startDate, and endDate are required." });
    }

    // Ensure endDate is not before startDate
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: "End date cannot be earlier than start date." });
    }

    // Find student where either father or mother has the matching email
    const student = await Student.findOne({
      $or: [{ "fatherInfo.email": email }, { "motherInfo.email": email }],
    });

    if (!student) {
      return res.status(404).json({ message: "No student found for this parent." });
    }

    const leave = new Leave({
      studentId: student._id,
      parentId: userId,
      reason: {
        title: reason.title,
        message: reason.message,
      },
      startDate,
      endDate,
    });

    await leave.save();
    res.status(201).json({ message: "Leave request submitted successfully.", leave });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// export const getLeaves = async (req, res) => {
//   try {
//     const { userId, role, email } = req.user;
//     let leaves;

//     if (role === "parent") {
//       // Find the student related to the parent
//       const student = await Student.findOne({
//         $or: [{ "fatherInfo.email": email }, { "motherInfo.email": email }],
//       });

//       if (!student) {
//         return res.status(404).json({ message: "No student found for this parent." });
//       }

//       leaves = await Leave.find({ studentId: student._id })
//         .populate("studentId", "name")
//         .populate("approvedBy", "name");
//     } else if (role === "admin") {
//       // Admin sees all leave requests
//       leaves = await Leave.find()
//         .populate("studentId", "name")
//         .populate("parentId", "name email")
//         .populate("approvedBy", "name");
//     } else {
//       return res.status(403).json({ message: "Access denied." });
//     }

//     res.status(200).json(leaves);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };
export const getLeaves = async (req, res) => {
  try {
    const { userId, role, email } = req.user;
    const { classId } = req.query; // Add classId from query params
    let leaves;

    if (role === "parent") {
      // Find the student related to the parent
      const student = await Student.findOne({
        $or: [{ "fatherInfo.email": email }, { "motherInfo.email": email }],
      });

      if (!student) {
        return res.status(404).json({ message: "No student found for this parent." });
      }

      leaves = await Leave.find({ studentId: student._id })
        .populate("studentId", "name")
        .populate("approvedBy", "name");
    } else if (role === "admin") {
      let query = {};
      if (classId) {
        // Find students in the specified class
        const students = await Student.find({ classId }).select("_id");
        if (students.length === 0) {
          return res.status(200).json([]);
        }
        query = { studentId: { $in: students.map((s) => s._id) } };
      }
      // Admin sees all leave requests or filtered by class
      leaves = await Leave.find(query)
        .populate("studentId", "name")
        .populate("parentId", "name email")
        .populate("approvedBy", "name");
    } else {
      return res.status(403).json({ message: "Access denied." });
    }

    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const updateLeaveStatus = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { leaveId, status } = req.body;

    if (role !== "teacher" && role !== "admin") {
      return res.status(403).json({ message: "Only teachers or admins can update leave status." });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status update." });
    }

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    leave.status = status;
    leave.approvedBy = userId;
    leave.updatedAt = new Date();
    await leave.save();

    res.status(200).json({ message: `Leave ${status} successfully.`, leave });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getTeacherClassLeaves = async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can access this endpoint." });
    }

    // Find classes assigned to the teacher
    const classes = await Class.find({ teacherId: userId });
    console.log(classes);
    if (!classes || classes.length === 0) {
      return res.status(404).json({ message: "No classes assigned to this teacher." });
    }

    const classIds = classes.map((c) => c._id);

    // Find students in those classes
    const students = await Student.find({ classId: { $in: classIds } });
    const studentIds = students.map((s) => s._id);

    // Find leave requests for those students
    const leaves = await Leave.find({ studentId: { $in: studentIds } })
      .populate("studentId", "name")
      .populate("approvedBy", "name");

    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};