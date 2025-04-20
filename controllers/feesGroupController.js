// controllers/feesGroupController.js
import feesGroup from '../models/feesGroup.js';

export const createFeesGroup = async (req, res) => {
  try {
    const { id, name, description, status } = req.body;
    
    const newfeesGroup = new feesGroup({
      id,
      name,
      description,
      status
    });

    const savedFeesGroup = await newfeesGroup.save();
    res.status(201).json(savedFeesGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllFeesGroups = async (req, res) => {
  try {
    const newfeesGroups = await feesGroup.find();
    res.json(newfeesGroups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeesGroupById = async (req, res) => {
  try {
    const newfeesGroup = await feesGroup.findById(req.params.id);
    if (!newfeesGroup) return res.status(404).json({ message: 'Fees Group not found' });
    res.json(newfeesGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateFeesGroup = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const newfeesGroup = await feesGroup.findByIdAndUpdate(
      req.params.id,
      { name, description, status, updatedAt: Date.now() },
      { new: true }
    );
    if (!newfeesGroup) return res.status(404).json({ message: 'Fees Group not found' });
    res.json(newfeesGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteFeesGroup = async (req, res) => {
  try {
    const newfeesGroup = await feesGroup.findByIdAndDelete(req.params.id);
    if (!newfeesGroup) return res.status(404).json({ message: 'Fees Group not found' });
    res.json({ message: 'Fees Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

