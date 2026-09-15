import express from "express";
import { validate } from "../middlewares/validate.js";
import { colaboradorSchema } from "../controllers/ColaboradorController.js"; 

export function crearColaboradorRouter(colaboradorController){
    const router = express.Router();

    router.route("/")
    .get((req,res) => colaboradorController.obtenerTodos(req, res))
    .post( validate(colaboradorSchema),
        (req,res) => colaboradorController.crear(req, res));

        return router;
}

