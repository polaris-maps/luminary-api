import { Router } from "express";
import * as buildingController from "../controllers/buildingController";

const router = Router();

router.get("/app/building/all", buildingController.getAllBuildings);
router.get("/app/building/:id", buildingController.getBuilding);

export default router;
