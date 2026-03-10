const express = require("express");
const router = express.Router();
const Appointment = require("../models/appointment");
const checkAccess = require("../middlewares/checkAccess");

router.get("/get-appointments/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const appointment = await Appointment.find({email}).populate("doctor");
    if (appointment == null) {
      res.json({ message: "No Appointments Booked!" });
    } else {
      res.json(appointment);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/get-all-appointments", async (req, res) => {
  try {
    const appointments = await Appointment.find({});
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/get-appointment/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Get doctor details first
    const Doctor = require("../models/doctor");
    const User = require("../models/user");
    
    let doctor = await Doctor.findById(id);
    if (!doctor) {
      doctor = await User.findById(id);
    }
    
    if (!doctor) {
      console.log("Doctor not found for ID:", id);
      return res.json({ message: "Doctor not found!" });
    }
    
    // Get doctor identifiers
    const doctorId = doctor._id.toString();
    const doctorName = doctor.name || doctor.userName || "";
    const doctorEmail = doctor.email || "";
    
    console.log("Searching appointments for:", { doctorId, doctorName, doctorEmail, originalId: id });
    
    // First, let's see all appointments to debug
    const allAppointments = await Appointment.find({});
    console.log("Total appointments in database:", allAppointments.length);
    console.log("Sample appointments:", allAppointments.slice(0, 3).map(apt => ({
      _id: apt._id,
      doctor: apt.doctor,
      patient: apt.patient
    })));
    
    // Try to find appointments by multiple criteria
    let appointments = await Appointment.find({ 
      $or: [
        { doctor: doctorId },
        { doctor: id },
        { doctor: doctorName },
        { doctor: doctorEmail }
      ]
    });
    
    console.log("Found appointments with query:", appointments.length);
    
    // If still no appointments, try to find by partial match or any doctor field
    if (appointments.length === 0) {
      console.log("No appointments found with exact match, trying broader search...");
      // Get all appointments and filter manually
      const allApts = await Appointment.find({});
      appointments = allApts.filter(apt => {
        const aptDoctor = apt.doctor?.toString() || apt.doctor;
        return aptDoctor === doctorId || 
               aptDoctor === id ||
               aptDoctor === doctorName ||
               aptDoctor === doctorEmail ||
               aptDoctor?.includes(doctorId) ||
               aptDoctor?.includes(id);
      });
      console.log("Found appointments after manual filter:", appointments.length);
    }

    if (appointments.length === 0) { 
      res.json({ message: "No Appointments Booked!" });
    } else {
      res.json(appointments);
    }
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ error: error.message });
  }
});


router.post("/add-appointment", async (req, res) => {
  const { doctor, patient, appointmentDate, reason, phone,email,time } = req.body;

  try {
    const newAppointment = new Appointment({
      doctor,
      patient,
      appointmentDate ,
      reason,
      phone,
      email,
      time
    });

    const savedAppointment = await newAppointment.save();
    res.status(200).json(savedAppointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
