import { Elysia, t } from "elysia";
import * as projectControllers from "../controllers/project.controller.ts";
import { authPlugin } from "../middleware/auth.ts";

export const deployRoutes = new Elysia({ prefix: "/api/project" })
  .use(authPlugin)
  .post("/deploy", projectControllers.deployProject, {
    body: t.Object({
      github_url: t.String(),
    }),
  });