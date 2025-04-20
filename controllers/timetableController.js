import Timetable from "../models/timetable.js";
import Class from "../models/class.js";
import mongoose from "mongoose";

// Create or update a weekly timetable
export const createOrUpdateTimetable = async (req, res) => {
  try {
    const { classId, weekStartDate, weekEndDate, days } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!classId || !weekStartDate || !weekEndDate || !days) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Validate class
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Authorization check
    if (req.user.role === "teacher" && !classData.teacherId.includes(new mongoose.Types.ObjectId(userId))) {
      return res.status(403).json({ message: "You are not authorized to manage this class timetable" });
    }

    // Check for existing timetable
    const existingTimetable = await Timetable.findOne({
      classId,
      weekStartDate: new Date(weekStartDate),
      weekEndDate: new Date(weekEndDate),
    });

    let timetable;
    if (existingTimetable) {
      existingTimetable.days = days;
      existingTimetable.lastUpdatedBy = userId;
      timetable = await existingTimetable.save();
    } else {
      timetable = new Timetable({
        classId,
        weekStartDate: new Date(weekStartDate),
        weekEndDate: new Date(weekEndDate),
        days,
        createdBy: userId,
        sessionId: classData.sessionId, // Ensure sessionId is included
      });
      await timetable.save();
    }

    res.status(200).json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get timetable for a specific week and class
export const getTimetable = async (req, res) => {
  try {
    const { classId, weekStartDate } = req.params;
    const userId = req.user.userId;

    // Validate class
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Authorization check
    if (req.user.role === "teacher" && !classData.teacherId.includes(new mongoose.Types.ObjectId(userId))) {
      return res.status(403).json({ message: "You are not authorized to view this class timetable" });
    }

    const startDate = new Date(weekStartDate);
    startDate.setUTCHours(0, 0, 0, 0);

    const timetable = await Timetable.findOne({
      classId,
      weekStartDate: startDate,
    }).populate("days.slots.teacherId", "name");

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found for this week" });
    }

    res.status(200).json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update timetable activity status (for teachers)
export const updateActivityStatus = async (req, res) => {
  try {
    const { timetableId, dayIndex, slotIndex, status, notes } = req.body;
    const userId = req.user.userId;

    if (!timetableId || dayIndex === undefined || slotIndex === undefined || !status) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const timetable = await Timetable.findById(timetableId);
    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    const classData = await Class.findById(timetable.classId);
    if (req.user.role === "teacher" && !classData.teacherId.includes(new mongoose.Types.ObjectId(userId))) {
      return res.status(403).json({ message: "You are not authorized to update this timetable" });
    }

    if (dayIndex >= timetable.days.length || slotIndex >= timetable.days[dayIndex].slots.length) {
      return res.status(400).json({ message: "Invalid day or slot index" });
    }

    timetable.days[dayIndex].slots[slotIndex].status = status;
    if (notes) {
      timetable.days[dayIndex].slots[slotIndex].notes = notes;
    }
    timetable.lastUpdatedBy = userId;

    const updatedTimetable = await timetable.save();
    res.status(200).json(updatedTimetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student's timetable (for parents)
export const getStudentTimetable1 = async (req, res) => {
  try {
    const { studentId, weekStartDate } = req.params;

    const student = await Student.findById(studentId)
      .populate("classId", "name")
      .populate("sessionId", "name");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (req.user.role === "parent") {
      const isParent = await Student.findOne({
        _id: studentId,
        $or: [
          { "fatherInfo.email": req.user.email },
          { "motherInfo.email": req.user.email },
          { "guardianInfo.email": req.user.email },
        ],
      });

      if (!isParent) {
        return res.status(403).json({ message: "You are not authorized to view this timetable" });
      }
    }

    const startDate = new Date(weekStartDate);
    const timetable = await Timetable.findOne({
      sessionId: student.sessionId,
      classId: student.classId,
      weekStartDate: startDate,
    }).populate("days.slots.teacherId", "name");

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found for this week" });
    }

    if (req.user.role === "parent") {
      const formattedTimetable = await formatTimetableForParent(timetable, studentId);
      return res.status(200).json(formattedTimetable);
    }

    res.status(200).json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to format timetable for parent view
async function formatTimetableForParent(timetable, studentId) {
  const formattedDays = [];

  for (const day of timetable.days) {
    const attendance = await Attendance.findOne({
      classId: timetable.classId,
      date: day.date,
      "records.studentId": studentId,
    });

    if (attendance) {
      const studentRecord = attendance.records.find((r) => r.studentId.toString() === studentId);
      if (studentRecord && studentRecord.status === "present") {
        const formattedDay = {
          day: day.day,
          date: day.date,
          slots: day.slots.map((slot) => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
            activity: slot.activity,
            teacherId: slot.teacherId,
            status: slot.status,
            notes: slot.status === "completed" ? slot.notes : undefined,
          })),
        };
        formattedDays.push(formattedDay);
      }
    }
  }

  return {
    _id: timetable._id,
    sessionId: timetable.sessionId,
    classId: timetable.classId,
    weekStartDate: timetable.weekStartDate,
    weekEndDate: timetable.weekEndDate,
    days: formattedDays,
  };
}