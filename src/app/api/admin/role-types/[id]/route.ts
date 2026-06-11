import RoleType from "@/models/roleType";
import { masterTypeItemRoutes } from "../../_masterTypeRoutes";

const handlers = masterTypeItemRoutes(RoleType);
export const PATCH = handlers.PATCH;
