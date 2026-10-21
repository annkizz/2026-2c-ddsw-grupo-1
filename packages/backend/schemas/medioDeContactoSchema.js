import mongoose from "mongoose";

export const medioDeContactoSchema = new mongoose.Schema(
  {
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
  },
  { _id: false },
);
