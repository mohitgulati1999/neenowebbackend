// controllers/feesTypeController.js
import feesType from '../models/feesType.js';
import feesGroup from '../models/feesGroup.js';

export const createFeesType = async (req, res) => {
  try {
    const { id, name, feesGroupId, description, status } = req.body; // Changed feesType to name, feesGroup to feesGroupId
    console.log(req.body);
    const prevFeesGroup = await feesGroup.findById(feesGroupId);
    if (!prevFeesGroup) return res.status(404).json({ message: "Fees Group not found" });

    const newFeesType = new feesType({
      id,
      name, // Changed from feesType to name
      feesGroup: feesGroupId, // Changed from feesGroup to feesGroupId (still stored as feesGroup in DB)
      description,
      status,
    });

    const savedFeesType = await newFeesType.save();
    res.status(201).json(savedFeesType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllFeesTypes = async (req, res) => {
  try {
    const newfeesTypes = await feesType.find().populate('feesGroup', 'name');
    res.json(newfeesTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeesTypeById = async (req, res) => {
  try {
    const newfeesType = await feesType.findById(req.params.id).populate('feesGroup', 'name');
    if (!newfeesType) return res.status(404).json({ message: 'Fees Type not found' });
    res.json(newfeesType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateFeesType = async (req, res) => {
  try {
    const { name, feesGroupId, description, status } = req.body;

    if (feesGroupId) {
      const existingFeesGroup = await feesGroup.findById(feesGroupId); // Renamed to avoid conflict
      if (!existingFeesGroup) return res.status(404).json({ message: 'Fees Group not found' });
    }

    const updatedFeesType = await feesType.findByIdAndUpdate(
      req.params.id,
      { name, feesGroup: feesGroupId, description, status, updatedAt: Date.now() },
      { new: true }
    ).populate('feesGroup', 'name');

    if (!updatedFeesType) return res.status(404).json({ message: 'Fees Type not found' });
    res.json(updatedFeesType);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};

export const deleteFeesType = async (req, res) => {
  try {
    const delfeesType = await feesType.findByIdAndDelete(req.params.id);
    if (!delfeesType) return res.status(404).json({ message: 'Fees Type not found' });
    res.json({ message: 'Fees Type deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeesListByGroup = async (req, res) => {
  try {
    const { feesGroupId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(feesGroupId)) {
        return res.status(400).json({ message: "Invalid feesGroupId" });
    }
    console.log(req.params);
    const feeTypes = await feesType.find({ feesGroup: feesGroupId })
    if (!feeTypes.length) {
      return res.status(404).json({ message: "No fee types found for this fees group" });
    }
    res.status(200).json(feeTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};