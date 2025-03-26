import Material from "../models/material.js"; 

// Add Material
export const addMaterial = async (req, res) => {
  try {
    let { name, category, serialNumber, quantity, expiryDate, source, vendorDetails } = req.body;

    // Trim values & Validate
    name = name.trim();
    serialNumber = serialNumber?.trim();
    if (!name || !category || !source) {
      return res.status(400).json({ message: "Name, Category, and Source are required" });
    }
    if (quantity !== undefined && (isNaN(quantity) || quantity < 1)) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    // Auto-increment serial number if not provided
    if (!serialNumber) {
      const lastMaterial = await Material.findOne().sort("-createdAt");
      serialNumber = lastMaterial ? `MAT-${lastMaterial._id}` : "MAT-1";
    }

    // Check for duplicate serial number
    if (serialNumber) {
      const materialExists = await Material.findOne({ serialNumber });
      if (materialExists) return res.status(400).json({ message: "Serial Number Already Exists" });
    }

    const newMaterial = new Material({
      name,
      category,
      serialNumber,
      quantity,
      expiryDate,
      source,
      vendorDetails,
      addedBy: req.user.id,
    });

    await newMaterial.save();
    res.status(201).json({ message: "Material Added Successfully", material: newMaterial });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update Material
export const updateMaterial = async (req, res) => {
  try {
    const { name, category, quantity, expiryDate, source, status, vendorDetails } = req.body;
    const material = await Material.findById(req.params.id);

    if (!material) return res.status(404).json({ message: "Material Not Found" });

    if (name) material.name = name.trim();
    if (category) material.category = category;
    if (quantity !== undefined) {
      if (isNaN(quantity) || quantity < 1) return res.status(400).json({ message: "Quantity must be at least 1" });
      material.quantity = quantity;
    }
    if (expiryDate) material.expiryDate = expiryDate;
    if (source) material.source = source;
    if (status) material.status = status;
    if (vendorDetails) material.vendorDetails = vendorDetails;

    await material.save();
    res.status(200).json({ message: "Material Updated", material });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Soft Delete (Marks status as "Deleted")
export const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: "Material Not Found" });

    if (material.status === "Deleted") {
      return res.status(400).json({ message: "Material already deleted" });
    }

    material.status = "Deleted";
    await material.save();
    res.status(200).json({ message: "Material Marked as Deleted", material });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get All Materials with Pagination & Filtering
export const getAllMaterials = async (req, res) => {
  try {
    const { category, source, page = 1, limit = 10 } = req.query;
    const filters = { status: { $ne: "Deleted" } };

    if (category) filters.category = category;
    if (source) filters.source = source;

    const materials = await Material.find(filters)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({ page, materials });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get a Single Material by ID (Exclude Deleted)
export const getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material || material.status === "Deleted") {
      return res.status(404).json({ message: "Material Not Found" });
    }
    res.status(200).json(material);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
