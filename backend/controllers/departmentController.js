// controllers/departmentController.js
import Department from "../models/department.js";

export const createDepartment = async (req, res) => {
  try {
    const { name, description, location, contactEmail, contactPhone } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Department name is required"
      });
    }

    const existingDept = await Department.findOne({ name });
    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: "Department with this name already exists"
      });
    }

    const department = new Department({
      name,
      description,
      location,
      contactEmail,
      contactPhone,
      head: req.user.id
    });

    await department.save();

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create department",
      error: error.message
    });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('head', 'name email')
      .sort({ name: 1 });

    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
      error: error.message
    });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update department",
      error: error.message
    });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Department deactivated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to deactivate department",
      error: error.message
    });
  }
};