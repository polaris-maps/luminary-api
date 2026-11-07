import { Router } from "express";
import * as routeController from "../controllers/routeController.js";

const router = Router();

router.post("/app/route", routeController.getRoute);

export default router;
