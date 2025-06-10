const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true },
    contactNumber: { type: Number, required: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Please enter a valid email address."],
    },
    address: { type: String, trim: true },
    dateOfBirth: { type: Date, required: true },
    assignedCars: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Car", default: [] },
    ],
    trips: [{ type: mongoose.Schema.Types.ObjectId, ref: "Trip" }],
    numberOfTrips: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["available", "unavailable", "in-trip"], // Updated enum
      default: "available",

    },
    currentCar: { type: mongoose.Schema.Types.ObjectId, ref: "Car" },
    password: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
  },
  {
    timestamps: true,
  }
);

driverSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  this.numberOfTrips = this.trips.length;
  next();
});

driverSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Driver = mongoose.model("Driver", driverSchema);

module.exports = Driver;
