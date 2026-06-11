import PerformanceType from "@/models/performanceType";
import { masterTypeItemRoutes } from "../../_masterTypeRoutes";

const handlers = masterTypeItemRoutes(PerformanceType);
export const PATCH = handlers.PATCH;
