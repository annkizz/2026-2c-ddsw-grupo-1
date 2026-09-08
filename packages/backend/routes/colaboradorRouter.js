import express from "express";

export function crearColaboradorRouter(colaboradorController){
    const router = express.Router();

    router.route("/")
    .get((req,res) => colaboradorController.obtenerTodos(req, res))
    .post((req,res) => colaboradorController.crear(req, res));

        return router;
}

