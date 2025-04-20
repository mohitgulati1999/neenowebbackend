import mongoose from "mongoose";
import faker from "faker";

// Import your models
const FeeComponent = require("./models/feeComponent");
const FeeStructure = require("./models/feeStructure");
const StudentFee = require("./models/studentFee");
const School = require("./models/school");
const Student = require("./models/student");

const url=process.env.MONGO_URL

// Connect to MongoDB
mongoose.connect(
  url,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Function to generate random fee components
const generateFeeComponents = async (count) => {
  word = [
    "annualcharges",
    "admissionfee",
    "tuitionfee",
    "sportsfee",
    "labfee",
    "libraryfee",
    "transportfee",
    "examfee",
    "securityfee",
    "miscellaneousfee",
  ];
  const feeComponents = [];
  for (let i = 0; i < count; i++) {
    const feeComponent = new FeeComponent({
      name: word[i],
      amount: faker.random.number({ min: 10000, max: 90000 }),
    });
    await feeComponent.save();
    feeComponents.push(feeComponent._id);
  }
  return feeComponents;
};

// Function to generate random fee structures
const generateFeeStructures = async (feeComponents, schoolId) => {
  const feeStructure = new FeeStructure({
    class: new mongoose.Types.ObjectId(), // Random class ID
    session: new mongoose.Types.ObjectId(), // Random session ID
    feeComponents: feeComponents,
    school: schoolId,
  });
  await feeStructure.save();
  return feeStructure._id;
};

// Function to generate random schools
const generateSchools = async () => {
  const school = new School({
    name: faker.company.companyName(),
    address: faker.address.streetAddress(),
    city: faker.address.city(),
    pincode: faker.random.number({ min: 100000, max: 999999 }), // 6 digit pincode
    phone: faker.random.number({ min: 1000000000, max: 9999999999 }), // 10 digit phone number
    email: faker.internet.email(),
    principal: faker.name.findName(),
  });
  await school.save();
  return school._id;
};

// Function to generate random students
export const generateStudents = async (count = 10) => {
  const students = [];

  for (let i = 0; i < count; i++) {
    const student = new studentModel({
      session: `2023-2024`,
      name: faker.name.findName(),
      age: faker.datatype.number({ min: 5, max: 18 }),
      dob: faker.date.past(18, new Date("2018-01-01")), // Random DOB within 18 years
      parentName: null, // Assuming no parent data for now
      aadhar_number: faker.datatype.number({ min: 100000000000, max: 999999999999 }).toString(),
      address: faker.address.streetAddress(),
      transport: faker.random.arrayElement(["Bus", "Car", "Bicycle", "Walk"]),
      attendance: null, // Assuming no attendance data initially
      studentFee: null, // Assuming no fee data initially
    });

    await student.save();
    console.log("Generated student")
    students.push(student._id);
  }

  return students;
};

// Function to generate random student fees
const generateStudentFees = async (students, feeStructureId, feeComponents) => {
  for (const studentId of students) {
    const studentFee = new StudentFee({
      student: studentId,
      feeStructure: feeStructureId,
      feeComponents: feeComponents.map((component) => ({
        component: component,
      })),
      feeCycle: {
        startMonth: faker.date.month(),
        endMonth: faker.date.month(),
      },
      payments: [
        {
          date: faker.date.past(),
          amount: faker.finance.amount(),
        },
      ],
    });
    await studentFee.save();
  }
};

// Main function to generate all data
const generateData = async () => {
  const feeComponents = await generateFeeComponents(5); // Generate 5 fee components
  const schoolId = await generateSchools(); // Generate 1 school
  const feeStructureId = await generateFeeStructures(feeComponents, schoolId); // Generate 1 fee structure
  const students = await generateStudents(10); // Generate 10 students
  await generateStudentFees(students, feeStructureId, feeComponents); // Generate student fees for 10 students

  console.log("Data generation complete!");
  mongoose.disconnect();
};

generateData();
