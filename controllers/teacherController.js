import Teacher from "../models/teacher.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs";

// Create a new teacher (admin-only)
export const createTeacher = async (req, res) => {
  const {
    id,
    email,
    password,
    name,
    dateOfBirth,
    gender,
    phoneNumber,
    address,
    joiningDate,
    qualifications,
    experienceYears,
    subjects,
    payroll,
    contractType,
    workShift,
    workLocation,
    languagesSpoken,
    emergencyContact,
    bio,
  } = req.body;

  // Explicitly check for required fields
  if (!email || email === null) {
    return res.status(400).json({ message: "Email is required" });
  }
  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }
  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  try {
    // Step 1: Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Step 2: Check if the teacher ID is unique
    const existingTeacher = await Teacher.findOne({ id });
    if (existingTeacher) {
      return res.status(400).json({ message: "Teacher ID already exists" });
    }

    // Step 3: Create a User entry for the teacher
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone: phoneNumber, // Match User schema field name
      role: "teacher",
      status: "active",
    });
    await newUser.save();

    // Step 4: Create a Teacher entry linked to the User
    const newTeacher = new Teacher({
      userId: newUser._id,
      id,
      name,
      email,
      dateOfBirth,
      gender,
      phoneNumber,
      address,
      joiningDate,
      qualifications,
      experienceYears,
      subjects,
      payroll,
      contractType,
      workShift,
      workLocation,
      languagesSpoken,
      emergencyContact,
      bio,
    });
    await newTeacher.save();

    res.status(201).json({ message: "Teacher added successfully", teacher: newTeacher });
  } catch (error) {
    console.error("Error adding teacher:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get all teachers
export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().populate("userId", "name email phoneNumber");
    res.status(200).json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get a single teacher by ID (MongoDB _id)
export const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate("userId", "name email phoneNumber");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.status(200).json(teacher);
  } catch (error) {
    console.error("Error fetching teacher:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get a single teacher by custom ID (id field)
export const getTeacherByCustomId = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ id: req.params.id }).populate("userId", "name email phoneNumber");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.status(200).json(teacher);
  } catch (error) {
    console.error("Error fetching teacher by custom ID:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Update a teacher (admin-only)
export const updateTeacher = async (req, res) => {
  const {
    id, // Custom ID field
    name,
    dateOfBirth,
    gender,
    phoneNumber,
    address,
    joiningDate,
    qualifications,
    experienceYears,
    subjects,
    payroll,
    contractType,
    workShift,
    workLocation,
    dateOfLeaving,
    languagesSpoken,
    emergencyContact,
    bio,
    email, // Include email for User update
  } = req.body;

  try {
    // Find teacher by custom ID
    const teacher = await Teacher.findOne({ id: req.params.id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Prevent changing the custom ID to an existing one (if id is provided and different)
    if (id && id !== teacher.id) {
      const existingTeacher = await Teacher.findOne({ id });
      if (existingTeacher) {
        return res.status(400).json({ message: "Teacher ID already exists" });
      }
      teacher.id = id;
    }

    // Update teacher fields (only if provided in request body)
    teacher.name = name || teacher.name;
    teacher.dateOfBirth = dateOfBirth || teacher.dateOfBirth;
    teacher.gender = gender || teacher.gender;
    teacher.phoneNumber = phoneNumber || teacher.phoneNumber;
    teacher.address = address || teacher.address;
    teacher.joiningDate = joiningDate || teacher.joiningDate;
    teacher.qualifications = qualifications || teacher.qualifications;
    teacher.experienceYears = experienceYears !== undefined ? experienceYears : teacher.experienceYears;
    teacher.subjects = subjects || teacher.subjects;
    teacher.payroll = payroll || teacher.payroll;
    teacher.contractType = contractType || teacher.contractType;
    teacher.workShift = workShift || teacher.workShift;
    teacher.workLocation = workLocation || teacher.workLocation;
    teacher.dateOfLeaving = dateOfLeaving !== undefined ? dateOfLeaving : teacher.dateOfLeaving;
    teacher.languagesSpoken = languagesSpoken || teacher.languagesSpoken;
    teacher.emergencyContact = emergencyContact || teacher.emergencyContact;
    teacher.bio = bio || teacher.bio;

    // Update the linked User if email is provided
    if (email && teacher.userId) {
      await User.findByIdAndUpdate(teacher.userId, { email });
    }

    const updatedTeacher = await teacher.save();
    await updatedTeacher.populate("userId", "name email phoneNumber");
    res.status(200).json({ message: "Teacher updated successfully", teacher: updatedTeacher });
  } catch (error) {
    console.error("Error updating teacher:", error.message);
    res.status(500).json({ message: error.message });
  }
};


export const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    await User.findByIdAndDelete(teacher.userId);

    res.status(200).json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Error deleting teacher:", error.message);
    res.status(500).json({ message: error.message });
  }
};