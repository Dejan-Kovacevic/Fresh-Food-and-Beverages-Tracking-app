import { Router, type IRouter } from "express";
import healthRouter from "./health";
import entriesRouter from "./entries";
import summaryRouter from "./summary";
import aiRouter from "./ai";
import fitnessRouter from "./fitness";

const router: IRouter = Router();

router.use(healthRouter);
router.use(entriesRouter);
router.use(summaryRouter);
router.use(aiRouter);
router.use(fitnessRouter);

export default router;
