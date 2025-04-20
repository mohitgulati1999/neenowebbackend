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
