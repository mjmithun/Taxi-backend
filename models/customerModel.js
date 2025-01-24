const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const customerSchema = new Schema({
    name: { type: String, required: true, trim: true },
    contactNumber: { type: Number, required: true },
    AadhaarNo: {
      type: Number,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Please enter a valid email address."],
    },
    address: { type: String, trim: true },
    trips: [{ type: mongoose.Schema.Types.ObjectId, ref: "Trip" }],
    numberOfTrips: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  }
)

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;