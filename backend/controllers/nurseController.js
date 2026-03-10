const express = require("express");
const router = express.Router();
const  Nurse  = require("../models/nurse");
const bcrypt = require("bcrypt");

const checkAdmin = require("../middlewares/checkAdmin");
const { error } = require("console");

router.get("/get-nurses", async (req, res) => {
    try {
      const nurses = await Nurse.find({}).populate("department" , "name");
  
      res.json(nurses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
router.get("/get-allNurses", async (req, res) => {
    try {
      const nurses = await Nurse.find()
  
      res.json(nurses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

router.post("/add-nurse", async (req, res) => {
  const {name, email,department} = req.body;
  try {
    const existingUser = await Nurse.findOne({ email });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Nurse with this email already exists" });
    }
    const firstemail = email.split('@')[0];
    const password = firstemail + '@123' ;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new Nurse({
      name,
      email,
      password: hashedPassword,
      department
    });

    const savedUser = await newUser.save();

    res.status(200).json({savedUser,message:"Success"});
  } catch (error) {
    res.status(500).json({error: error.message });
  }

});


router.get("/get-nurse/:id", async (req, res) => {
  try {
    const nurse = await Nurse.findById(req.params.id);
    if (!nurse) {
      return res.status(404).json({ error: "Nurse not found" });
    }
    res.json(nurse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/profile-update", async (req, res) => {
  const { userId, updatedProfile } = req.body;
  try {
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    const updatedUser = await Nurse.findByIdAndUpdate(
      userId,
      { $set: updatedProfile },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "Nurse not found" });
    }

    res.status(200).json({ status: "Success", user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.status(500).json({ error: "Failed to update profile", message: error.message });
  }
});

module.exports = router;

