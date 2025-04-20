// controllers/timetable.js
import Timetable from "../models/timetable.js";
import Class from "../models/class.js";
import Session from "../models/session.js";
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

    // Check if the user is admin or teacher assigned to this class
    if (req.user.role === "teacher" && !classData.teacherId.includes(userId)) {
      return res.status(403).json({ message: "You are not authorized to manage this class timetable" });
    }

    // Check for existing timetable for this week
    const existingTimetable = await Timetable.findOne({
      classId,
      weekStartDate: new Date(weekStartDate),
      weekEndDate: new Date(weekEndDate)
    });

    let timetable;
    if (existingTimetable) {
      // Update existing timetable
      existingTimetable.days = days;
      existingTimetable.lastUpdatedBy = userId;
      timetable = await existingTimetable.save();
    } else {
      // Create new timetable
      timetable = new Timetable({
        classId,
        weekStartDate: new Date(weekStartDate),
        weekEndDate: new Date(weekEndDate),
        days,
        createdBy: userId
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

    // Validate class
    const classData = await Class.findById(classId);

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Handle ISO date input and normalize
    const startDate = new Date(weekStartDate);
    startDate.setUTCHours(0, 0, 0, 0);

    // Query timetable without sessionId
    const query = {
      classId,
      weekStartDate: startDate
    };
    const timetable = await Timetable.findOne(query)
      .populate("days.slots.teacherId", "name"); // Correct nested path

    if (!timetable) {
      const allTimetables = await Timetable.find({ classId, weekStartDate: startDate });
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
    const userId = req.user._id;

    // Validate input
    if (!timetableId || dayIndex === undefined || slotIndex === undefined || !status) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const timetable = await Timetable.findById(timetableId);
    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    // Check if the user is a teacher assigned to this class
    const classData = await Class.findById(timetable.classId);
    if (req.user.role === "teacher" && !classData.teacherId.includes(userId)) {
      return res.status(403).json({ message: "You are not authorized to update this timetable" });
    }

    // Update the specific activity status
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
    
    // Get student info
    const student = await Student.findById(studentId)
      .populate("classId", "name")
      .populate("sessionId", "name");
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if the requesting user is the parent of this student
    if (req.user.role === "parent") {
      const isParent = await Student.findOne({
        _id: studentId,
        $or: [
          { "fatherInfo.email": req.user.email },
          { "motherInfo.email": req.user.email },
          { "guardianInfo.email": req.user.email }
        ]
      });
      
      if (!isParent) {
        return res.status(403).json({ message: "You are not authorized to view this timetable" });
      }
    }

    // Get timetable for the student's class
    const startDate = new Date(weekStartDate);
    const timetable = await Timetable.findOne({
      sessionId: student.sessionId,
      classId: student.classId,
      weekStartDate: startDate
    }).populate("teacherId", "name");

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found for this week" });
    }

    // For parents, only show completed activities if student was present that day
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
      "records.studentId": studentId
    });
    
    // Only include day if student was present
    if (attendance) {
      const studentRecord = attendance.records.find(r => r.studentId.toString() === studentId);
      if (studentRecord && studentRecord.status === "present") {
        const formattedDay = {
          day: day.day,
          date: day.date,
          slots: day.slots.map(slot => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
            activity: slot.activity,
            teacherId: slot.teacherId,
            status: slot.status,
            // Only show notes if activity is completed
            notes: slot.status === "completed" ? slot.notes : undefined
          }))
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
    days: formattedDays
  };
}