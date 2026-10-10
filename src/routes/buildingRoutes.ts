import { Router } from "express";
import * as buildingController from "../controllers/buildingController";

const router = Router();

router.get("/app/building/all", buildingController.getAllBuildings);

export default router;
