import PerformanceType from "@/models/performanceType";
import { masterTypeCollectionRoutes } from "../_masterTypeRoutes";

const handlers = masterTypeCollectionRoutes(PerformanceType);
export const GET = handlers.GET;
export const POST = handlers.POST;
