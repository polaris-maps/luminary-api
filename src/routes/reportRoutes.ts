import { Router } from "express";
import * as reportController from "../controllers/reportController.js";

const router = Router();

router.get("/app/indoorIssue/all", reportController.getAllReports);
router.post("/app/indoorIssue/add", reportController.addReport);
router.delete("/app/indoorIssue/delete/:id", reportController.deleteReport);

export default router;
