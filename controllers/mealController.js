import Meal from "../models/meal.js";

export const addMeal = async (req, res) => {
  try {
    const { day, name, description, mealType } = req.body;
    // if (req.user.role !== "admin") {
    //   return res.status(403).json({ message: "Unauthorized" });
    // }

    if (!day || !name || !description || !mealType) {
      return res.status(400).json({ message: "Day, name, description, and meal type are required" });
    }
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const validMealTypes = ["breakfast", "lunch"];
    if (!validDays.includes(day)) {
      return res.status(400).json({ message: "Invalid day. Must be Monday to Friday" });
    }
    if (!validMealTypes.includes(mealType)) {
      return res.status(400).json({ message: "Invalid meal type. Must be breakfast or lunch" });
    }

    const existingMeal = await Meal.findOne({ day, mealType });
    if (existingMeal) {
      return res.status(400).json({ message: `A ${mealType} meal already exists for ${day}` });
    }

    const meal = new Meal({
      day,
      name,
      description,
      picture: null, 
      // allergies: allergies || [], 
      mealType
    });

    await meal.save();

    res.status(201).json({ message: "Meal added successfully", meal });
  } catch (error) {
    console.error("Add meal error:", error);
    res.status(500).json({ message: "Server error while adding meal" });
  }
};

export const getMealPlan = async (req, res) => {
  try {
    // if (req.user.role !== "parent") {
    //   return res.status(403).json({ message: "Unauthorized" });
    // }

    const meals = await Meal.find({})
      .sort({ day: 1, mealType: 1 }) 
      .lean();
    const mealPlan = {
      Monday: { breakfast: null, lunch: null },
      Tuesday: { breakfast: null, lunch: null },
      Wednesday: { breakfast: null, lunch: null },
      Thursday: { breakfast: null, lunch: null },
      Friday: { breakfast: null, lunch: null }
    };

    meals.forEach(meal => {
      mealPlan[meal.day][meal.mealType] = {
        name: meal.name,
        description: meal.description,
        picture: meal.picture,
        // allergies: meal.allergies
      };
    });

    res.status(200).json(mealPlan);
  } catch (error) {
    console.error("Get meal plan error:", error);
    res.status(500).json({ message: "Server error while fetching meal plan" });
  }
};

export const editMeal = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "admin") {
      return res.status(403).json({ message: "Only admins can edit meals." });
    }

    const { id } = req.params;
    const { day, name, description, mealType } = req.body;

    if (!day || !name || !description || !mealType) {
      return res.status(400).json({ message: "Day, name, description, and meal type are required" });
    }

    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const validMealTypes = ["breakfast", "lunch"];
    if (!validDays.includes(day)) {
      return res.status(400).json({ message: "Invalid day. Must be Monday to Friday" });
    }
    if (!validMealTypes.includes(mealType)) {
      return res.status(400).json({ message: "Invalid meal type. Must be breakfast or lunch" });
    }

    const meal = await Meal.findById(id);
    if (!meal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    // Check for duplicate meal (same day and mealType, excluding current meal)
    const existingMeal = await Meal.findOne({
      day,
      mealType,
      _id: { $ne: id }
    });
    if (existingMeal) {
      return res.status(400).json({ message: `A ${mealType} meal already exists for ${day}` });
    }

    meal.day = day;
    meal.name = name;
    meal.description = description;
    meal.mealType = mealType;
    await meal.save();

    res.status(200).json({ message: "Meal updated successfully", meal });
  } catch (error) {
    console.error("Edit meal error:", error);
    res.status(500).json({ message: "Server error while editing meal" });
  }
};

export const deleteMeal = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "admin") {
      return res.status(403).json({ message: "Only admins can delete meals." });
    }

    const { id } = req.params;
    const meal = await Meal.findByIdAndDelete(id);
    if (!meal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    res.status(200).json({ message: "Meal deleted successfully" });
  } catch (error) {
    console.error("Delete meal error:", error);
    res.status(500).json({ message: "Server error while deleting meal" });
  }
};