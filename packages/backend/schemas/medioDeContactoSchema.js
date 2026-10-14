import mongoose from "mongoose";

const medioDeContactoSchema = new mongoose.Schema({
  tipoDeContacto: {
    type: String,
    required: true,
    trim: true,
  },
  contacto: {
    type: String,
    required: true,
    trim: true,
  },
}, { _id: false });