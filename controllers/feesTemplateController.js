import FeesTemplate from '../models/feesTemplate.js';
import Class from "../models/class.js";
import FeesGroup from '../models/feesGroup.js';
import FeesType from '../models/feesType.js';
import Session from "../models/session.js";
import Student from '../models/student.js';
import StudentFee from '../models/studentFee.js';
import FeePayments from '../models/feePayments.js';
// Create a new fee template
export const createFeeTemplate = async (req, res) => {
  try {
    const { templateId, name, sessionId, fees, status } = req.body;

    // Validate session
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Validate fees (feesGroups and feeTypes)
    for (const fee of fees) {
      const feesGroup = await FeesGroup.findById(fee.feesGroup);
      if (!feesGroup) return res.status(404).json({ message: `Fees Group ${fee.feesGroup} not found` });

      for (const feeType of fee.feeTypes) {
        const feesTypeDoc = await FeesType.findOne({ _id: feeType.feesType, feesGroup: fee.feesGroup });
        if (!feesTypeDoc) return res.status(404).json({ message: `Fees Type ${feeType.feesType} not found or not associated with Fees Group ${fee.feesGroup}` });
      }
    }

    const newFeeTemplate = new FeesTemplate({
      templateId,
      name,
      sessionId,
      classIds: [], // Initialize with empty array
      fees,
      status,
    });

    const savedFeeTemplate = await newFeeTemplate.save();
    await savedFeeTemplate.populate([
      { path: 'sessionId', select: 'name sessionId' },
      { path: 'classIds', select: 'id name' },
      { path: 'fees.feesGroup', select: 'name' },
      { path: 'fees.feeTypes.feesType', select: 'name' },
    ]);

    res.status(201).json(savedFeeTemplate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all fee templates
export const getAllFeeTemplates = async (req, res) => {
  try {
    const feeTemplates = await FeesTemplate.find().populate([
      { path: 'sessionId', select: 'name sessionId' },
      { path: 'classIds', select: 'id name' },
      { path: 'fees.feesGroup', select: 'name' },
      { path: 'fees.feeTypes.feesType', select: 'name' },
    ]);
    res.json(feeTemplates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get fee template by ID
export const getFeeTemplateById = async (req, res) => {
  try {
    const feeTemplate = await FeesTemplate.findById(req.params.id).populate([
      { path: 'sessionId', select: 'name sessionId' },
      { path: 'classIds', select: 'id name' },
      { path: 'fees.feesGroup', select: 'name' },
      { path: 'fees.feeTypes.feesType', select: 'name' },
    ]);
    if (!feeTemplate) return res.status(404).json({ message: 'Fee Template not found' });
    res.json(feeTemplate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a fee template
export const updateFeeTemplate = async (req, res) => {
  try {
    const { templateId, name, sessionId, classIds, fees, status } = req.body;

    // Validate session if provided
    if (sessionId) {
      const session = await Session.findById(sessionId);
      if (!session) return res.status(404).json({ message: 'Session not found' });
    }

    // Validate classIds and session association if provided
    if (classIds && classIds.length > 0) {
      const classes = await Class.find({ _id: { $in: classIds }, sessionId });
      if (classes.length !== classIds.length) {
        return res.status(404).json({ message: 'One or more classes not found or not associated with this session' });
      }
    }

    // Validate fees if provided
    if (fees) {
      for (const fee of fees) {
        const feesGroup = await FeesGroup.findById(fee.feesGroup);
        if (!feesGroup) return res.status(404).json({ message: `Fees Group ${fee.feesGroup} not found` });

        for (const feeType of fee.feeTypes) {
          const feesTypeDoc = await FeesType.findOne({ _id: feeType.feesType, feesGroup: fee.feesGroup });
          if (!feesTypeDoc) return res.status(404).json({ message: `Fees Type ${feeType.feesType} not found or not associated with Fees Group ${fee.feesGroup}` });
        }
      }
    }

    const updatedFeeTemplate = await FeesTemplate.findByIdAndUpdate(
      req.params.id,
      { templateId, name, sessionId, classIds, fees, status, updatedAt: Date.now() },
      { new: true }
    ).populate([
      { path: 'sessionId', select: 'name sessionId' },
      { path: 'classIds', select: 'id name' },
      { path: 'fees.feesGroup', select: 'name' },
      { path: 'fees.feeTypes.feesType', select: 'name' },
    ]);

    if (!updatedFeeTemplate) return res.status(404).json({ message: 'Fee Template not found' });
    res.json(updatedFeeTemplate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// // controllers/feesTemplateController.js
// export const assignFeesToStudents = async (req, res) => {
//   const { templateId, sessionId, studentIds, customFees = null } = req.body;

//   try {
//     console.log("Request Body:", JSON.stringify(req.body, null, 2));

//     const feeTemplate = await FeesTemplate.findById(templateId).populate("classIds");
//     if (!feeTemplate) return res.status(404).json({ message: "Fee Template not found" });

//     if (sessionId !== feeTemplate.sessionId.toString()) {
//       return res.status(400).json({ message: "Session ID does not match the template's session" });
//     }

//     if (!feeTemplate.classIds || feeTemplate.classIds.length === 0) {
//       return res.status(400).json({ message: "No classes assigned to this template" });
//     }

//     if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
//       return res.status(400).json({ message: "No students selected for assignment" });
//     }

//     const students = await Student.find({
//       _id: { $in: studentIds },
//       sessionId,
//       classId: { $in: feeTemplate.classIds.map((c) => c._id) },
//     });

//     if (students.length === 0) {
//       return res.status(404).json({ message: "No valid students found for assignment" });
//     }

//     const studentFeePromises = students.map(async (student) => {
//       let studentFee = await StudentFee.findOne({ studentId: student._id, sessionId });
//       const defaultFees = feeTemplate.fees.map((group) => ({
//         feesGroup: group.feesGroup,
//         feeTypes: group.feeTypes.map((type) => ({
//           feesType: type.feesType,
//           amount: type.amount,
//           originalAmount: type.amount,
//           discount: 0,
//           discountType: "fixed",
//         })),
//       }));

//       const feesToAssign = customFees
//         ? customFees.filter((group) =>
//             feeTemplate.fees.some((tGroup) => tGroup.feesGroup.toString() === group.feesGroup)
//           )
//         : defaultFees;

//       console.log(`Fees to Assign for ${student._id}:`, JSON.stringify(feesToAssign, null, 2));

//       if (!studentFee) {
//         studentFee = new StudentFee({
//           studentId: student._id,
//           sessionId,
//           classId: student.classId,
//           feeTemplateId: feeTemplate._id,
//           customFees: feesToAssign,
//         });
//         await studentFee.save();
//         console.log(`Created StudentFee for ${student._id}:`, studentFee);
//       } else {
//         const existingFeeGroupIds = studentFee.customFees.map((g) => g.feesGroup.toString());
//         studentFee.customFees = [
//           ...studentFee.customFees,
//           ...feesToAssign.filter((g) => !existingFeeGroupIds.includes(g.feesGroup)),
//         ];
//         await studentFee.save();
//         console.log(`Updated StudentFee for ${student._id}:`, studentFee);
//       }

//       const paymentPromises = feesToAssign.flatMap((feeGroup) =>
//         feeGroup.feeTypes.map(async (feeType) => {
//           console.log(`Processing FeeType for ${student._id}:`, feeType);
//           const existingPayment = await FeePayments.findOne({
//             studentId: student._id,
//             sessionId,
//             feesGroupId: feeGroup.feesGroup,
//             feesTypeId: feeType.feesType,
//           });
//           if (!existingPayment) {
//             const feePayment = new FeePayments({
//               studentId: student._id,
//               sessionId,
//               feesGroupId: feeGroup.feesGroup,
//               feesTypeId: feeType.feesType,
//               amountDue: feeType.amount,
//               dueDate: new Date(),
//             });
//             await feePayment.save();
//             console.log(`Created FeePayment for ${student._id}:`, feePayment);
//           } else {
//             console.log(`FeePayment already exists for ${student._id}:`, existingPayment);
//           }
//         })
//       );
//       await Promise.all(paymentPromises);
//     });

//     await Promise.all(studentFeePromises);

//     res.status(200).json({ success: true, message: "Fees assigned to selected students successfully" });
//   } catch (error) {
//     console.error("Error in assignFeesToStudents:", error);
//     res.status(500).json({ message: error.message });
//   }
// };
// controllers/feesTemplateController.js
export const assignFeesToStudents = async (req, res) => {
  const { templateId, sessionId, studentIds, customFees = null } = req.body;

  try {
    console.log("Request Body:", JSON.stringify(req.body, null, 2));

    const feeTemplate = await FeesTemplate.findById(templateId).populate("classIds");
    if (!feeTemplate) return res.status(404).json({ message: "Fee Template not found" });

    if (sessionId !== feeTemplate.sessionId.toString()) {
      return res.status(400).json({ message: "Session ID does not match the template's session" });
    }

    if (!feeTemplate.classIds || feeTemplate.classIds.length === 0) {
      return res.status(400).json({ message: "No classes assigned to this template" });
    }

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "No students selected for assignment" });
    }

    const students = await Student.find({
      _id: { $in: studentIds },
      sessionId,
      classId: { $in: feeTemplate.classIds.map((c) => c._id) },
    });

    if (students.length === 0) {
      return res.status(404).json({ message: "No valid students found for assignment" });
    }

    const studentFeePromises = students.map(async (student) => {
      let studentFee = await StudentFee.findOne({ studentId: student._id, sessionId });
      const defaultFees = feeTemplate.fees.map((group) => ({
        feesGroup: group.feesGroup,
        feeTypes: group.feeTypes.map((type) => ({
          feesType: type.feesType,
          amount: type.amount,
          originalAmount: type.amount,
          discount: 0,
          discountType: "fixed",
          dueDate: new Date(), // Default due date (you can override this with customFees)
        })),
      }));

      // If customFees are provided, use them and ensure dueDate is included
      const feesToAssign = customFees
        ? customFees.map((group) => ({
            feesGroup: group.feesGroup,
            feeTypes: group.feeTypes.map((type) => ({
              feesType: type.feesType,
              amount: type.amount,
              originalAmount: type.amount || type.amount,
              discount: type.discount || 0,
              discountType: type.discountType || "fixed",
              dueDate: type.dueDate ? new Date(type.dueDate) : new Date(), // Use provided dueDate or default
            })),
          })).filter((group) =>
            feeTemplate.fees.some((tGroup) => tGroup.feesGroup.toString() === group.feesGroup)
          )
        : defaultFees;

      console.log(`Fees to Assign for ${student._id}:`, JSON.stringify(feesToAssign, null, 2));

      if (!studentFee) {
        studentFee = new StudentFee({
          studentId: student._id,
          sessionId,
          classId: student.classId,
          feeTemplateId: feeTemplate._id,
          customFees: feesToAssign,
        });
        await studentFee.save();
        console.log(`Created StudentFee for ${student._id}:`, studentFee);
      } else {
        const existingFeeGroupIds = studentFee.customFees.map((g) => g.feesGroup.toString());
        studentFee.customFees = [
          ...studentFee.customFees,
          ...feesToAssign.filter((g) => !existingFeeGroupIds.includes(g.feesGroup)),
        ];
        await studentFee.save();
        console.log(`Updated StudentFee for ${student._id}:`, studentFee);
      }

      // Create or update FeePayment entries with due dates
      const paymentPromises = feesToAssign.flatMap((feeGroup) =>
        feeGroup.feeTypes.map(async (feeType) => {
          console.log(`Processing FeeType for ${student._id}:`, feeType);
          const existingPayment = await FeePayments.findOne({
            studentId: student._id,
            sessionId,
            feesGroupId: feeGroup.feesGroup,
            feesTypeId: feeType.feesType,
          });
          if (!existingPayment) {
            const feePayment = new FeePayments({
              studentId: student._id,
              sessionId,
              feesGroupId: feeGroup.feesGroup,
              feesTypeId: feeType.feesType,
              amountDue: feeType.amount,
              dueDate: feeType.dueDate, // Use the due date from feeType
            });
            await feePayment.save();
            console.log(`Created FeePayment for ${student._id}:`, feePayment);
          } else {
            // Update dueDate if it changes
            await FeePayments.updateOne(
              {
                studentId: student._id,
                sessionId,
                feesGroupId: feeGroup.feesGroup,
                feesTypeId: feeType.feesType,
              },
              { dueDate: feeType.dueDate }
            );
            console.log(`Updated FeePayment for ${student._id}:`, existingPayment);
          }
        })
      );
      await Promise.all(paymentPromises);
    });

    await Promise.all(studentFeePromises);

    res.status(200).json({ success: true, message: "Fees assigned to selected students successfully" });
  } catch (error) {
    console.error("Error in assignFeesToStudents:", error);
    res.status(500).json({ message: error.message });
  }
};
// Delete a fee template
export const deleteFeeTemplate = async (req, res) => {
  try {
    const deletedFeeTemplate = await FeesTemplate.findByIdAndDelete(req.params.id);
    if (!deletedFeeTemplate) return res.status(404).json({ message: 'Fee Template not found' });
    res.json({ message: 'Fee Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get classes by session ID with their templates
export const getClassesBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const classes = await Class.find({ sessionId }).populate('sessionId', 'name sessionId');
    const classIds = classes.map((c) => c._id);

    const templates = await FeesTemplate.find({ classIds: { $in: classIds } }).populate([
      { path: 'sessionId', select: 'name sessionId' },
      { path: 'classIds', select: 'id name' },
      { path: 'fees.feesGroup', select: 'name' },
      { path: 'fees.feeTypes.feesType', select: 'name' },
    ]);

    const result = classes.map((classDoc) => ({
      ...classDoc.toObject(),
      templates: templates.filter((t) => t.classIds.some((id) => id.toString() === classDoc._id.toString())),
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get fee templates for a class
export const getFeeTemplatesForClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const feeTemplates = await FeesTemplate.find({ classIds: classId }).populate([
      { path: 'sessionId', select: 'name sessionId' },
      { path: 'classIds', select: 'id name' },
      { path: 'fees.feesGroup', select: 'name' },
      { path: 'fees.feeTypes.feesType', select: 'name' },
    ]);
    if (!feeTemplates.length) return res.status(404).json({ message: 'No templates assigned to this class' });
    res.json(feeTemplates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all classes with their templates for a specific session
export const getClassesWithTemplatesBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Validate session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Get all classes for this session
    const classes = await Class.find({ sessionId })
      .populate('sessionId', 'name sessionId')
      .lean();

    // Get all templates that have any of these classes assigned
    const templates = await FeesTemplate.find({ 
      sessionId,
      classIds: { $exists: true, $not: { $size: 0 } }
    })
    .populate([
      { path: 'sessionId', select: 'name sessionId' },
      { path: 'classIds', select: 'id name' },
      { path: 'fees.feesGroup', select: 'name' },
      { path: 'fees.feeTypes.feesType', select: 'name' }
    ])
    .lean();

    // Map templates to their respective classes
    const classesWithTemplates = classes.map(classDoc => {
      const classTemplates = templates.filter(template => 
        template.classIds.some(classId => 
          classId._id.toString() === classDoc._id.toString()
        )
      );

      return {
        ...classDoc,
        templates: classTemplates.map(t => ({
          _id: t._id,
          name: t.name,
          fees: t.fees.map(feeGroup => ({
            feesGroup: feeGroup.feesGroup,
            feeTypes: feeGroup.feeTypes.map(feeType => ({
              feesType: feeType.feesType,
              amount: feeType.amount
            }))
          })),
          status: t.status,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt
        }))
      };
    });

    res.json({
      session: {
        _id: session._id,
        name: session.name,
        sessionId: session.sessionId
      },
      classes: classesWithTemplates
    });
  } catch (error) {
    console.log('Error fetching classes with templates:', error);
    res.status(500).json({ 
      message: 'Failed to fetch classes with templates',
      error: error.message 
    });
  }
};

export const getAssignedStudents = async (req, res) => {
  try {
    const { templateId, sessionId } = req.params;
    
    // First, get the template to access its fees groups
    const template = await FeesTemplate.findById(templateId)
      .populate('fees.feesGroup');
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Fee template not found'
      });
    }

    // Extract all fees group IDs from the template
    const feesGroupIds = template.fees.map(f => f.feesGroup._id);
    
    // Find all student fees that reference this template
    const assignedStudents = await StudentFee.find({
      sessionId,
      feeTemplateId: templateId
    }).distinct('studentId');
    
    // If you want to include student details, you can populate them
    const students = await Student.find({
      _id: { $in: assignedStudents }
    }).select('name admissionNumber');

    res.status(200).json({
      success: true,
      count: assignedStudents.length,
      data: students
    });
  } catch (error) {
    console.error('Error in getAssignedStudents:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getStudentFees = async (req, res) => {
  const { studentId, sessionId } = req.params;

  try {
    const studentFee = await StudentFee.findOne({ studentId, sessionId }).populate([
      { path: "customFees.feesGroup", select: "name" }, // Populate nested feesGroup
      { path: "customFees.feeTypes.feesType", select: "name" }, // Populate nested feesType
    ]);

    if (!studentFee) {
      return res.status(404).json({ message: "Student fee not found" });
    }

    res.status(200).json(studentFee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};