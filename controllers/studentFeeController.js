import Student from "../models/student.js";
import StudentFee from "../models/studentFee.js";
import FeePayment from "../models/feePayments.js";
import FeesGroup from "../models/feesGroup.js";
import FeesType from "../models/feesType.js";
import mongoose from "mongoose";
import FeeReminderNotification from "../models/feeReminderNotification.js";
import User from "../models/user.js";
// Get all students with their fee components by session and class
export const getStudentsWithFees = async (req, res) => {
  const { sessionId, classId } = req.query;

  try {
    const students = await Student.find({ sessionId, classId }).populate("classId");
    const studentFees = await StudentFee.find({ sessionId, classId })
      .populate("feeTemplateId")
      .populate("customFees.feesGroup", "name")
      .populate("customFees.feeTypes.feesType", "name");

    const result = students.map((student) => {
      const feeData = studentFees.find((sf) => sf.studentId.equals(student._id));
      return {
        student: {
          _id: student._id,
          name: student.name,
          admissionNumber: student.admissionNumber,
          classId: student.classId,
        },
        fees: feeData ? feeData.customFees : [],
      };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const collectFees = async (req, res) => {
  const { studentId, sessionId } = req.body;

  try {
    const feePayments = await FeePayment.find({
      studentId,
      sessionId,
      status: { $in: ["Pending", "Overdue"] },
    })
      .populate("studentId", "name fatherInfo.email motherInfo.email")
      .populate("feesGroupId", "name")
      .populate("feesTypeId", "name");

    if (!feePayments.length) {
      return res.status(404).json({ message: "No pending or overdue fees found" });
    }

    const student = feePayments[0].studentId;
    const parentEmail = student.fatherInfo?.email || student.motherInfo?.email;
    if (!parentEmail) {
      return res.status(400).json({ message: "No parent email found for this student" });
    }

    const parentUser = await User.findOne({ email: parentEmail, role: "parent" });
    if (!parentUser) {
      return res.status(404).json({ message: "Parent user not found" });
    }

    let totalAmountDue = 0;
    const feeDetails = feePayments.map((fp) => {
      const amountDue = fp.amountDue - fp.amountPaid;
      totalAmountDue += amountDue;
      return `${fp.feesTypeId.name} (${fp.feesGroupId.name}): $${amountDue} (Due: ${fp.dueDate.toLocaleDateString()})`;
    }).join("\n");

    // Create notification for parent
    const message = `Fee collection initiated for ${student.name}:\n${feeDetails}\nTotal Due: $${totalAmountDue}. Please pay at your earliest convenience.`;
    const notification = new Notification({
      recipientId: parentUser._id,
      message,
      relatedStudentId: studentId,
      relatedFeePaymentId: feePayments[0]._id,
    });
    await notification.save();

    // Optionally update FeePayment status or mark as "in progress"
    // For now, we'll just send the notification without updating payment status
    // Uncomment below if you want to mark as "Collected" or similar:
    await FeePayment.updateMany(
      { studentId, sessionId, status: { $in: ["Pending", "Overdue"] } },
      { status: "Collected" }
    );

    res.status(200).json({ message: "Fee collection initiated, parent notified" });
  } catch (error) {
    console.error("Error collecting fees:", error);
    res.status(500).json({ message: error.message });
  }
};
// Edit a student's fee structure (e.g., for scholarships)
export const editStudentFees = async (req, res) => {
  const { studentId, sessionId, customFees } = req.body;

  try {
    // Validate customFees
    for (const feeGroup of customFees) {
      const feesGroup = await FeesGroup.findById(feeGroup.feesGroup);
      if (!feesGroup) return res.status(404).json({ message: `Fees Group ${feeGroup.feesGroup} not found` });

      for (const feeType of feeGroup.feeTypes) {
        const feesTypeDoc = await FeesType.findById(feeType.feesType);
        if (!feesTypeDoc) return res.status(404).json({ message: `Fees Type ${feeType.feesType} not found` });
      }
    }

    const studentFee = await StudentFee.findOneAndUpdate(
      { studentId, sessionId },
      { customFees, updatedAt: Date.now() },
      { new: true }
    )
      .populate("customFees.feesGroup", "name")
      .populate("customFees.feeTypes.feesType", "name");

    if (!studentFee) return res.status(404).json({ message: "Student fee record not found" });

    // Update FeePayment entries
    for (const feeGroup of customFees) {
      for (const feeType of feeGroup.feeTypes) {
        await FeePayment.updateOne(
          { studentId, sessionId, feesGroupId: feeGroup.feesGroup, feesTypeId: feeType.feesType },
          { amountDue: feeType.amount }
        );
      }
    }

    res.status(200).json(studentFee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Send fee payment reminder
// export const sendFeeReminder = async (req, res) => {
//   const { studentId, sessionId, feesGroupId, feesTypeId } = req.body;

//   try {
//     const feePayment = await FeePayment.findOneAndUpdate(
//       { studentId, sessionId, feesGroupId, feesTypeId, status: "Pending" },
//       { reminderSent: true, reminderDate: Date.now() },
//       { new: true }
//     )
//       .populate("studentId", "name fatherInfo.email motherInfo.email")
//       .populate("feesGroupId", "name")
//       .populate("feesTypeId", "name");

//     if (!feePayment) {
//       return res.status(404).json({ message: "Fee payment not found or already paid" });
//     }

//     const amountDue = feePayment.amountDue - feePayment.amountPaid;
//     const parentEmail = feePayment.studentId.fatherInfo?.email || feePayment.studentId.motherInfo?.email;
//     let recipientId, recipientType;

//     if (parentEmail) {
//       const parentUser = await User.findOne({ email: parentEmail, role: "parent" });
//       recipientId = parentUser ? parentUser._id : studentId;
//       recipientType = parentUser ? "parent" : "student";
//     } else {
//       recipientId = studentId;
//       recipientType = "student";
//     }

//     const message = `Reminder: Your ${feePayment.feesTypeId.name} fee (${feePayment.feesGroupId.name}) of $${amountDue} is due on ${feePayment.dueDate.toLocaleDateString()}. Please pay promptly.`;
//     const reminderNotification = new FeeReminderNotification({
//       recipientId,
//       recipientType,
//       title: "Fee Payment Reminder",
//       message,
//       feePaymentId: feePayment._id,
//       dueDate: feePayment.dueDate.toISOString().split("T")[0],
//       amountDue,
//     });
//     await reminderNotification.save();

//     res.status(200).json({
//       message: "Reminder sent successfully",
//       feePayment,
//       notification: reminderNotification,
//     });
//   } catch (error) {
//     console.error("Error sending fee reminder:", error);
//     res.status(500).json({ message: error.message });
//   }
// };
export const sendFeeReminder = async (req, res) => {
  const { studentId, sessionId, feesGroupId, feesTypeId } = req.body;

  try {
    const feePayment = await FeePayment.findOneAndUpdate(
      { studentId, sessionId, feesGroupId, feesTypeId, status: "Pending" },
      { reminderSent: true, reminderDate: Date.now() },
      { new: true }
    )
      .populate("studentId", "name fatherInfo.email motherInfo.email")
      .populate("feesGroupId", "name")
      .populate("feesTypeId", "name");

    if (!feePayment) {
      return res.status(404).json({ message: "Fee payment not found or already paid" });
    }

    console.log("Step 1: Fee Payment Found:", feePayment); // Debug: Check feePayment data

    const amountDue = feePayment.amountDue - feePayment.amountPaid;
    const fatherEmail = feePayment.studentId.fatherInfo?.email;
    const motherEmail = feePayment.studentId.motherInfo?.email;

    console.log("Step 2: Father Email:", fatherEmail); // Debug: Father’s email
    console.log("Step 3: Mother Email:", motherEmail); // Debug: Mother’s email

    const recipients = [];

    // Check for father
    if (fatherEmail) {
      const father = await User.findOne({ email: fatherEmail, role: "parent" });
      console.log("Step 4: Father User:", father); // Debug: Father’s User document
      if (father) recipients.push({ id: father._id, type: "parent" });
    }

    // Check for mother
    if (motherEmail) {
      const mother = await User.findOne({ email: motherEmail, role: "parent" });
      console.log("Step 5: Mother User:", mother); // Debug: Mother’s User document
      if (mother) recipients.push({ id: mother._id, type: "parent" });
    }

    // Fallback to student if no parents found
    if (recipients.length === 0) {
      recipients.push({ id: studentId, type: "student" });
    }

    console.log("Step 6: Recipients:", recipients); // Debug: Final list of recipients

    const reminders = [];
    for (const recipient of recipients) {
      const message = `Reminder: Your ${feePayment.feesTypeId.name} fee (${feePayment.feesGroupId.name}) of $${amountDue} is due on ${feePayment.dueDate.toLocaleDateString()}. Please pay promptly.`;
      const reminder = new FeeReminderNotification({
        recipientId: recipient.id,
        recipientType: recipient.type,
        title: "Fee Payment Reminder",
        message,
        feePaymentId: feePayment._id,
        dueDate: feePayment.dueDate.toISOString().split("T")[0],
        amountDue,
      });
      await reminder.save();
      reminders.push(reminder);
      console.log("Step 7: Reminder Created:", reminder); // Debug: Each created reminder
    }

    res.status(200).json({
      message: "Reminder(s) sent successfully",
      feePayment,
      notifications: reminders,
    });
    console.log("Step 8: Response Sent with Notifications:", reminders); // Debug: Final response
  } catch (error) {
    console.error("Step 9: Error sending fee reminder:", error); // Debug: Error details
    res.status(500).json({ message: error.message });
  }
};
// New function: Get fee payments aggregated by student for a session
export const getFeePaymentsBySession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const feePayments = await FeePayment.aggregate([
      { $match: { sessionId: new mongoose.Types.ObjectId(sessionId) } },
      {
        $group: {
          _id: "$studentId",
          totalAmountDue: { $sum: "$amountDue" },
          totalAmountPaid: { $sum: "$amountPaid" },
          fees: {
            $push: {
              feesGroupId: "$feesGroupId",
              feesTypeId: "$feesTypeId",
              amountDue: "$amountDue",
              amountPaid: "$amountPaid",
              dueDate: "$dueDate",
              status: "$status",
            },
          },
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      // Add $lookup for Class collection if class is a reference
      {
        $lookup: {
          from: "classes", // Adjust to your actual collection name
          localField: "student.classId", // If class is an ObjectId reference
          foreignField: "_id",
          as: "classInfo",
        },
      },
      {
        $unwind: {
          path: "$classInfo",
          preserveNullAndEmptyArrays: true, // Handle cases where classId might be missing
        },
      },
      {
        $project: {
          admNo: "$student.admissionNumber",
          rollNo: "$student.rollNumber",
          studentName: "$student.name",
          studentClass: {
            $cond: {
              if: { $ifNull: ["$classInfo.name", false] }, // Use class name if available
              then: "$classInfo.name",
              else: "$student.class", // Fallback to student.class if no reference
            },
          },
          studentSection: "$student.section",
          studentImage: "$student.photo",
          totalAmountDue: 1,
          totalAmountPaid: 1,
          lastDate: { $max: "$fees.dueDate" },
          status: {
            $cond: {
              if: { $eq: ["$totalAmountDue", "$totalAmountPaid"] },
              then: "Paid",
              else: "Pending",
            },
          },
          // Include additional student fields if needed
          student: {
            _id: "$student._id",
            admissionNumber: "$student.admissionNumber",
            rollNumber: "$student.rollNumber",
            name: "$student.name",
            email: "$student.email", // Add if exists
            phone: "$student.phone", // Add if exists
          },
        },
      },
    ]);

    console.log("Matched Fee Payments:", await FeePayment.find({ sessionId: new mongoose.Types.ObjectId(sessionId) }));
    console.log("Aggregated Result:", feePayments);

    res.status(200).json({ success: true, data: feePayments });
  } catch (error) {
    console.error("Error fetching fee payments:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getReminders = async(req, res)=>{
  try {
    const user = req.user; // From authMiddleware (contains _id, role, etc.)
    if (user.role !== "parent") {
      return res.status(403).json({ message: "Unauthorized: Only parents can access reminders" });
    }
    const parentId = req.user.userId;
    const students = await Student.find({
      $or: [
        { "fatherInfo.email": parent.email },
        { "motherInfo.email": parent.email },
      ],
    });

    const studentIds = students.map((student) => student._id);

    // Fetch reminders where the parent is the direct recipient or linked via their students
    const reminders = await FeeReminderNotification.find({
      $or: [
        { recipientId: parentId, recipientType: "parent" }, // Direct reminders to parent
        { recipientId: { $in: studentIds }, recipientType: "student" }, // Reminders sent to their students
      ],
    })
      .populate("feePaymentId", "feesGroupId feesTypeId amountDue amountPaid dueDate status") // Populate fee details
      .populate({
        path: "feePaymentId",
        populate: [
          { path: "feesGroupId", select: "name" },
          { path: "feesTypeId", select: "name" },
          { path: "studentId", select: "name admissionNumber" },
        ],
      })
      .sort({ createdAt: -1 }); // Sort by most recent first

    res.status(200).json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    console.error("Error fetching parent reminders:", error);
    res.status(500).json({ message: "Failed to fetch reminders", error: error.message });
  }
}