import RoleType from "@/models/roleType";
import { masterTypeCollectionRoutes } from "../_masterTypeRoutes";

const handlers = masterTypeCollectionRoutes(RoleType);
export const GET = handlers.GET;
export const POST = handlers.POST;
