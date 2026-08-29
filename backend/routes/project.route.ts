import { Elysia, t } from "elysia";
import * as projectControllers from "../controllers/project.controller";

export const deployRoutes = new Elysia({ prefix: "/api/project" })
.post("/deploy", projectControllers.deployProject, {
    body: t.Object({
        github_url: t.String()
    })
})