const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const carSchema = new Schema({
  registrationNumber: { type: String, required: true },
  make: { type: String },
  model: { type: String },
  year: { type: Number },
  status: {
    type: String,
    enum: ["available", "in-service", "in-trip"], // Updated enum
    default: "available", // Optional: set default value
  },
  numberOfTrips: { type: Number },
  trips: [{ type: Schema.Types.ObjectId, ref: "Trip" }],
  currentDriver: { type: Schema.Types.ObjectId, ref: "Driver" },
  income : {type:Number,default:0},
  expenses : {type:Number,default:0},
});

const Car = mongoose.model("Car", carSchema);

module.exports = Car;
