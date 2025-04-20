import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import methodOverride from "method-override";
import studentRoute from "./routes/studentRouter.js";
import classRoute from "./routes/classRouter.js";
import studentModel from "./models/student.js";
import { faker } from "@faker-js/faker";
import classModel from "./models/class.js";
import authRoute from './routes/authRouter.js'
import eventRoute from './routes/eventRouter.js'
import noticeRoute from './routes/noticeRouter.js'
import teacherRoute from './routes/teacherRouter.js'
import sessionRoute from './routes/sessionRouter.js'
import feesGroupRoute from './routes/feesGroupRouter.js'
import feesTypeRoute from './routes/feesTypeRouter.js'
import feesTemplateRoute from './routes/feesTemplateRouter.js'
import messageRoute from './routes/messageRouter.js'
import feePaymentRoute from './routes/studentFeeRouter.js'
import attendanceRoute from './routes/attendanceRouter.js';
import timetableRoute from './routes/timetableRouter.js';
import mealRoute from './routes/mealRouter.js'
import leaveRoute from './routes/leaveRouter.js'
import homeworkRoute from './routes/homeworkRouter.js'
import consentRoute from './routes/consentRouter.js'

dotenv.config();
const app = express();
const MongoURL = process.env.MONGODB_URI;
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoute)
app.use("/api/events", eventRoute);
app.use("/api/student", studentRoute);
app.use("/api/class", classRoute);
app.use("/api/notices", noticeRoute);
app.use("/api/teacher", teacherRoute);
app.use("/api/session", sessionRoute);
app.use("/api/feesGroup", feesGroupRoute);
app.use("/api/feesType", feesTypeRoute)
app.use("/api/messages", messageRoute);
app.use("/api/feesTemplate", feesTemplateRoute);
app.use("/api/feesPayment", feePaymentRoute);
app.use("/api/attendance", attendanceRoute);
app.use("/api/timetable", timetableRoute)
app.use("/api/meals", mealRoute);
app.use("/api/leaves", leaveRoute);
app.use("/api/homework", homeworkRoute);
app.use("/api/consent", consentRoute);

app.get("/", (req, res) => {
  res.send("hehehehe");
});

const generateStudent = () => ({
  session: faker.date.past().getFullYear().toString(),
  name: faker.person.fullName(),
  regNo: faker.string.alphanumeric(10).toUpperCase(),
  rollNo: faker.number.int({ min: 10000, max: 99999 }).toString(),
  gender: faker.helpers.arrayElement(["Male", "Female", "Other"]),
  class: faker.number.int({ min: 1, max: 12 }).toString(),
  section: faker.helpers.arrayElement(["A", "B", "C", "D"]),
  status: faker.helpers.arrayElement(["Active", "Inactive"]),
  grade: faker.helpers.arrayElement(["A", "B", "C", "D", "E"]),
  profileImage: faker.image.avatar(),
  age: faker.number.int({ min: 6, max: 18 }),
  dob: faker.date.birthdate({ min: 6, max: 18, mode: "age" }),
  parentName: new mongoose.Types.ObjectId(), // Replace with valid Parent ID if needed
  aadhar_number: faker.string.numeric(12),
  address: faker.location.streetAddress(),
  transport: faker.helpers.arrayElement(["Bus", "Van", "Walk", "Bike"]),
  attendance: new mongoose.Types.ObjectId(), // Replace with valid Attendance ID if needed
  studentFee: new mongoose.Types.ObjectId(), // Replace with valid StudentFee ID if needed
});
const generateClasses = async () => {
  try {
    // Define session and sections
    const session = "2024-25";
    const sections = ["A", "B"];
    const romanNumerals = ["I", "II", "III", "IV", "V"];

    const classes = [];

    for (let i = 0; i < romanNumerals.length; i++) {
      for (const section of sections) {
        classes.push({
          session,
          regNo: faker.string.alphanumeric(5).toUpperCase(),
          className: `${romanNumerals[i]}`,
          section,
          status: "Active",
          noOfStudent: 45, // Default value
          noOfSubjects: 6, // Default value
          teacher: [],
          student: [],
        });
      }
    }

    // Insert classes into the database
    await classModel.insertMany(classes);
    console.log("Classes generated successfully!");
  } catch (error) {
    console.error("Error generating classes:", error);
  }
};
console.log("Connecting to MongoDB with URI:", MongoURL);
mongoose
  .connect(MongoURL)
  .then(async () => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });
