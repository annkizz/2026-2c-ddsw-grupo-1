import express from "express";
import { validate } from "../middlewares/validate.js";
import {
  webhookActualizarSchema,
  webhookCrearSchema,
} from "../controllers/WebhookController.js";

// /colectivos/:idColectivo/webhooks 
export function crearWebhookRouter(webhookController) {
  const router = express.Router({ mergeParams: true });

  router
    .route("/")
    .get((req, res) => webhookController.listar(req, res))
    .post(validate(webhookCrearSchema), (req, res) =>
      webhookController.crear(req, res),
    );

  router
    .route("/:idWebhook")
    .put(validate(webhookActualizarSchema), (req, res) =>
      webhookController.actualizar(req, res),
    )
    .delete((req, res) => webhookController.eliminar(req, res));

  router.post("/:idWebhook/prueba", (req, res) =>
    webhookController.probar(req, res),
  );

  router.post("/:idWebhook/secreto", (req, res) =>
    webhookController.regenerarSecreto(req, res),
  );

  return router;
}