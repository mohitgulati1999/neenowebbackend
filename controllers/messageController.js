import Message from "../models/message.js";
import Student from "../models/student.js";
import Class from "../models/class.js";
import User from "../models/user.js";

// Send a message
export const sendMessage = async (req, res) => {
  const { sender, recipients, subject, message, attachment } = req.body;

  if (!sender) {
    return res.status(400).json({ error: "Sender ID is required" });
  }

  try {
    const newMessage = new Message({
      sender,
      recipients: {
        users: recipients.users || [],
        students: recipients.students || [],
        classes: recipients.classes || [],
      },
      subject,
      message,
      attachment,
    });
    await newMessage.save();
    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Get inbox messages for a user
export const getInbox = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userRole = user.role;
    let query = {};

    if (userRole === "admin") {
      // Admins only see messages where they are a direct recipient, not sender
      query = {
        "recipients.users": userId, // Admin must be in recipients.users
        sender: { $ne: userId },    // Exclude messages sent by the admin
      };
    } else if (userRole === "teacher") {
      const teacher = await Teacher.findOne({ userId });
      const teacherClasses = await Class.find({ teacherId: teacher._id });
      query = {
        $or: [
          { "recipients.users": userId }, // Direct messages to teacher
          { "recipients.classes": { $in: teacherClasses.map((c) => c._id) } }, // Messages to their classes
          { "recipients.students": { $exists: true } }, // Messages to students they teach (simplified)
        ],
        sender: { $ne: userId }, // Exclude messages sent by the teacher
      };
    } else if (userRole === "parent") {
      query = {
        "recipients.users": userId, // Direct messages to parent
        sender: { $ne: userId },    // Exclude messages sent by the parent
      };
    } else if (userRole === "student") {
      const student = await Student.findOne({ admissionNumber: user.email });
      if (!student) return res.status(404).json({ error: "Student not found" });
      query = {
        $or: [
          { "recipients.students": student._id }, // Direct to student
          { "recipients.classes": student.classId }, // To student's class
        ],
        sender: { $ne: userId }, // Exclude messages sent by student (if applicable)
      };
    }

    const messages = await Message.find(query)
      .populate("sender", "name role")
      .populate("recipients.users", "name role")
      .populate("recipients.students", "name")
      .populate("recipients.classes", "name");
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch inbox" });
  }
};

// Get sent messages for a user
export const getSentMessages = async (req, res) => {
  const { userId } = req.query; // Pass userId as query param since no auth

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const messages = await Message.find({ sender: userId })
      .populate("recipients.users", "name role")
      .populate("recipients.students", "name")
      .populate("recipients.classes", "name");
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch sent messages" });
  }
};

// Get all classes (for admin/teacher recipient selection)
export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate("teacherId", "name");
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch classes" });
  }
};

// Get classes for a specific teacher
export const getTeacherClasses = async (req, res) => {
  const { teacherId } = req.params;
  try {
    const teacher = await Teacher.findOne({ userId: teacherId });
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });
    const classes = await Class.find({ teacherId: teacher._id });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch teacher classes" });
  }
};

// Get all students (for admin/teacher recipient selection)
export const getAllStudents = async (req, res) => {
  const { classIds } = req.body; // Expect classIds array in request body
  try {
    let students;
    if (classIds && classIds.length > 0) {
      students = await Student.find({ classId: { $in: classIds } });
    } else {
      students = await Student.find(); // Fallback to all students if no classIds (not used here)
    }
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
};

// Get admins (for teacher/parent recipient selection)
export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch admins" });
  }
};

// Get student by parent (for parent to find their child’s class)
export const getStudentByParent = async (req, res) => {
  const { parentId } = req.params;
  try {
    const student = await Student.findOne({
      $or: [
        { "fatherInfo.email": (await User.findById(parentId)).email },
        { "motherInfo.email": (await User.findById(parentId)).email },
      ],
    });
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch student" });
  }
};

// Get teachers for a specific class (for parent recipient selection)
export const getClassTeachers = async (req, res) => {
  const { classId } = req.params;
  try {
    const classData = await Class.findById(classId).populate("teacherId", "name userId");
    if (!classData) return res.status(404).json({ error: "Class not found" });
    const teachers = await User.find({
      _id: { $in: classData.teacherId.map((t) => t.userId) },
    });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch class teachers" });
  }
};

export const deleteMessages = async (req, res) => {
  const { messageIds } = req.body;
  try {
    await Message.deleteMany({ _id: { $in: messageIds } });
    res.json({ message: 'Messages deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete messages' });
  }
};

export const getStudentByEmail = async (req, res) => {
  const { email } = req.query;
  try {
    const student = await Student.findOne({ admissionNumber: email }); // Adjust field name if needed
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};