import { Router } from "express";
import * as healthController from "../controllers/healthController";

const router = Router();

router.get("/app/", healthController.sayHello);
router.get("/app/health", healthController.getHealth);

export default router;
