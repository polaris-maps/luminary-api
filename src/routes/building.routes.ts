// Which URL goes to which controller function. Nothing else.
import { Router } from "express";
import * as buildingController from "../controllers/building.controller";

const router = Router();

router.get("/app/building/all", buildingController.getAllBuildings);

export default router;
