import express from "express"
import habilidadRouter from "./habilidadRouter.js"

const router = express.Router()

router.use("/habilidades", habilidadRouter);

export default router