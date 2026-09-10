import { Elysia, t } from "elysia";
import * as projectControllers from "../controllers/project.controller.ts";
import { getUserFromRequest } from "../middleware/auth.ts";

export const deployRoutes = new Elysia({ prefix: "/api/project" })
  .derive(async ({ headers, request }: any) => {
    const user = await getUserFromRequest(headers, request);
    return { user };
  })
  .onBeforeHandle(({ user, set }: any) => {
    if (!user) {
      set.status = 401 as any;
      return { error: "Unauthorized" };
    }
  })
  .post("/deploy", projectControllers.deployProject, {
    body: t.Object({
      github_url: t.String(),
    }),
  })
  .get("/deployment/:deploymentId", projectControllers.getDeploymentStatus)
  .get("/deployments", projectControllers.listDeployments)
  .get("/projects", projectControllers.listProjects);