import { Elysia } from "elysia"
import cors from "@elysiajs/cors"
import { authRoutes } from "./routes/auth.ts"
import { deployRoutes } from "./routes/project.route.ts"
import { getUserFromRequest } from "./middleware/auth.ts"
import { prisma } from "./lib/prisma.ts"
import { getProjectFile } from "./utils/r2.ts"

new Elysia()
  .use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }))
  .get("/health", () => ({
    status: "healthy",
  }))
  .use(authRoutes)
  .use(deployRoutes)
  .get("/api/protected", async ({ headers, request, set }: any) => {
    console.log(request);
    const user = await getUserFromRequest(headers, request)
    if (!user) {
      set.status = 401
      return { error: "Unauthorized" }
    }
    return { message: `Hello ${user.email}`, user }
  })
  .get("/*", async ({ headers, request, set }: any) => {
    const host: string | undefined = headers.host;

    if (!host) {
      set.status = 400;
      return { message: "Bad request: missing Host header." };
    }

    const hostWithoutPort = host.split(":")[0]!.toLowerCase();
    const url = new URL(request.url);
    const pathname = url.pathname || "/";

    const rootDomain = (process.env.ROOT_DOMAIN ?? "localhost").toLowerCase();
    const isRootHost =
      hostWithoutPort === rootDomain ||
      hostWithoutPort === "localhost" ||
      hostWithoutPort === "127.0.0.1" ||
      hostWithoutPort === `api.${rootDomain}`;

    if (isRootHost) {
      if (pathname === "/" || pathname === "") {
        return { message: "API server running", host };
      }
      set.status = 404;
      return { error: "Not found" };
    }

    if (!hostWithoutPort.includes(".")) {
      set.status = 404;
      return { error: "Not found - missing subdomain" };
    }
    const subdomain = hostWithoutPort.split(".")[0]!.toLowerCase().trim();
    if (!subdomain) {
      set.status = 400;
      return { error: "Invalid host" };
    }

    let deploymentId: string | null = null;

    const directDeployment = await prisma.deployment.findUnique({
      where: { id: subdomain },
    });
    if (directDeployment) {
      deploymentId = directDeployment.id;
    }

    if (!deploymentId) {
      const project = await prisma.project.findFirst({
        where: { name: subdomain },
      });
      if (project) {

        const latest = await prisma.deployment.findFirst({
          where: { projectId: project.id, status: "DEPLOYED" },
          orderBy: { id: "desc" },
        });

        if (latest) {
          deploymentId = latest.id;
        } 
        else {
          const anyDeployment = await prisma.deployment.findFirst({
            where: { projectId: project.id },
            orderBy: { id: "desc" },
          });

          if (anyDeployment) {
            if (anyDeployment.status !== "DEPLOYED") {
              set.status = 503;
              return {
                error: `Deployment ${anyDeployment.status.toLowerCase()}`,
                status: anyDeployment.status,
                deploymentId: anyDeployment.id,
              };
            }
            deploymentId = anyDeployment.id;
          }
        }
      }
    }

    if (!deploymentId) {
      const byDomain = await prisma.project.findFirst({
        where: { domain: hostWithoutPort },
      });
      if (byDomain) {
        const dep = await prisma.deployment.findFirst({
          where: { projectId: byDomain.id, status: "DEPLOYED" },
          orderBy: { id: "desc" },
        });
        if (dep) deploymentId = dep.id;
      }
    }

    if (!deploymentId) {
      set.status = 404;
      return { error: `No deployment found for host: ${subdomain}` };
    }

    try {
      const file = await getProjectFile(deploymentId, pathname);
      return new Response(file.Body as any, {
        status: 200,
        headers: {
          "Content-Type": file.ContentType,
          "Cache-Control": file.CacheControl ?? "",
          ...(file.ETag ? { ETag: file.ETag } : {}),
        },
      });
    } catch (err: any) {
      if (err?.message?.includes("File not found") || err?.message?.includes("NoSuchKey")) {
        set.status = 404;
        return { error: "File not found" };
      }
      if (err?.message?.includes("index.html not found")) {
        set.status = 404;
        return { error: "Site not deployed yet" };
      }
      console.error(`[proxy] R2 fetch error ${deploymentId}${pathname}:`, err);
      set.status = 500;
      return { error: "Failed to fetch file" };
    }
  })

  .listen(3000)

console.log("API server running on http://localhost:3000");