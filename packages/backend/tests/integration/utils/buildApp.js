import express from "express";
import { MatchingService } from "../../../services/MatchingService.js";
import { MatchingController } from "../../../controllers/MatchingController.js";
import { crearMatchingRouter } from "../../../routes/matchingRouter.js";
import { notFoundHandler } from "../../../middlewares/notFoundHandler.js";
import { errorHandler } from "../../../middlewares/errorHandler.js";

// patron de la clase de testing (buildApp): arma una mini app SOLO con el
// router de matching, sin escuchar puertos. supertest la ataca directamente.
// los repos llegan por parametro: en el test de clase se le pasan
// fakes (jest.fn) y en el de fusion los reales, el resto del wiring es igual.
export function crearAppDeMatching(
  colaboradorRepository,
  proyectoRepository,
  perfilRepository,
  colaboracionRepository,
) {
  const matchingService = new MatchingService(
    colaboradorRepository,
    proyectoRepository,
    perfilRepository,
    colaboracionRepository,
  );
  const matchingController = new MatchingController(matchingService);

  const app = express();
  app.use(express.json());
  app.use(crearMatchingRouter(matchingController));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
