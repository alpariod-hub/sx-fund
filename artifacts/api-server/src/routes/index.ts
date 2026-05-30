import { Router, type IRouter } from "express";
import healthRouter from "./health";
import assetsRouter from "./assets";
import poolRouter from "./pool";
import oracleRouter from "./oracle";
import investorsRouter from "./investors";
import contactRouter from "./contact";
import openaiRouter from "./openai/index";
import workspaceRouter from "./workspace/index";
import deployRouter from "./deploy/index";

const router: IRouter = Router();

router.use(healthRouter);
router.use(assetsRouter);
router.use(poolRouter);
router.use(oracleRouter);
router.use(investorsRouter);
router.use(contactRouter);
router.use(openaiRouter);
router.use(workspaceRouter);
router.use(deployRouter);

export default router;
