import { prisma } from "../lib/prisma.ts";
import { deployQueue } from "../utils/queue.ts";


async function validateGithubUrl(repoUrl: string) {
  try {
    const parsedUrl = new URL(repoUrl);
    
    if (parsedUrl.hostname !== 'github.com') {
      return { isValid: false, error: 'Only GitHub URLs are supported.' };
    }

    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) {
      return { isValid: false, error: 'Invalid GitHub repository format.' };
    }

    const owner = pathParts[0];
    const repo = pathParts[1]?.replace('.git', '');

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Vercel-Clone-Node-Backend'
      }
    });

    if (response.status === 404) {
      return { isValid: false, error: 'Repository not found or is private.' };
    }

    if (response.status !== 200) {
      return { isValid: false, error: 'Failed to verify repository with GitHub.' };
    }

    return { isValid: true, projectName: repo };

  } catch (error) {
    return { isValid: false, error: 'Malformed URL provided.' };
  }
}

export const deployProject = async ({ body, set, user, headers, request }: any) => {
  if (!user && headers) {
    const { getUserFromRequest } = await import("../middleware/auth.ts");
    user = await getUserFromRequest(headers, request);
  }
  if (!user) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  const { github_url } = body as { github_url: string };

  if (!github_url || typeof github_url !== "string" || github_url.trim() === "") {
    set.status = 400;
    return {
      message: "You need to input github url to deploy the project.",
    };
  }

  const checkRepo = await prisma.project.findFirst({
    where: {
      repo: github_url,
      userId: user.id,
    }
  });

  if(checkRepo) {
    const active = await prisma.deployment.findFirst({
      where: { projectId: checkRepo.id, status: { in: ["QUEUED", "RUNNING"] } },
    });
    if (active) {
      set.status = 409;
      return {
        status: active.status,
        message: "Deployment already in progress for this project.",
        projectId: checkRepo.id,
        deploymentId: active.id,
        projectName: checkRepo.name,
        url: `http://${checkRepo.name}.localhost:3000`,
      };
    }

    try {
      const deployment = await prisma.deployment.create({
        data: {
          projectId: checkRepo.id,
          status: "QUEUED",
        },
      });

      await deployQueue.add(
        "deploy-job",
        {
          github_url,
          deploymentId: deployment.id,
          projectId: checkRepo.id,
          userId: user.id,
        },
        {
          jobId: deployment.id,
        }
      );

      return {
        status: "QUEUED",
        message: "Project is already in our database, deploying again....",
        projectId: checkRepo.id,
        deploymentId: deployment.id,
        projectName: checkRepo.name,
        url: `http://${checkRepo.name}.localhost:3000`,
      };
    } catch (e: any) {
      if (e?.code === "P2002") {
        const raceActive = await prisma.deployment.findFirst({
          where: { projectId: checkRepo.id, status: { in: ["QUEUED", "RUNNING"] } },
        });
        set.status = 409;
        return {
          status: raceActive?.status ?? "QUEUED",
          message: "Deployment already in progress (race).",
          projectId: checkRepo.id,
          deploymentId: raceActive?.id ?? checkRepo.id,
          projectName: checkRepo.name,
          url: `http://${checkRepo.name}.localhost:3000`,
        };
      }
      throw e;
    }
  }

  const validityRes = await validateGithubUrl(github_url);

  if (!validityRes.isValid) {
    set.status = 400;
    return {
      message: validityRes.error ?? "Invalid url.",
    };
  }

  const project = await prisma.project.create({
    data: {
      name: validityRes.projectName?.toLowerCase() as string,
      repo: github_url,
      userId: user.id,
    },
  });

  let deployment: any;
  try {
    deployment = await prisma.deployment.create({
      data: {
        projectId: project.id,
        status: "QUEUED",
      },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      const raceActive = await prisma.deployment.findFirst({
        where: { projectId: project.id, status: { in: ["QUEUED", "RUNNING"] } },
      });
      set.status = 409;
      return {
        status: raceActive?.status ?? "QUEUED",
        message: "Deployment already in progress (race).",
        projectId: project.id,
        deploymentId: raceActive?.id ?? project.id,
        projectName: project.name,
        url: `http://${project.name}.localhost:3000`,
      };
    }
    throw e;
  }

  await deployQueue.add(
    "deploy-job",
    {
      github_url,
      deploymentId: deployment.id,
      projectId: project.id,
      userId: user.id,
    },
    {
      jobId: deployment.id,
    }
  );

  set.status = 201;
  return {
    status: "QUEUED",
    message: "Project is being deployed wait.",
    projectId: project.id,
    deploymentId: deployment.id,
    projectName: project.name,
    url: `http://${project.name}.localhost:3000`,
  };
};

export const getDeploymentStatus = async ({ params, set, user, headers, request }: any) => {
  if (!user && headers) {
    const { getUserFromRequest } = await import("../middleware/auth.ts");
    user = await getUserFromRequest(headers, request);
  }
  if (!user) {
    set.status = 401;
    return { error: "Unauthorized" };
  }
  const { deploymentId } = params as { deploymentId: string };
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: { project: { select: { userId: true, name: true, repo: true } } },
  });
  if (!deployment) {
    set.status = 404;
    return { error: "Deployment not found" };
  }
  if (deployment.project.userId !== user.id) {
    set.status = 403;
    return { error: "Forbidden" };
  }
  return {
    deploymentId: deployment.id,
    projectId: deployment.projectId,
    status: deployment.status,
    project: { name: deployment.project.name, repo: deployment.project.repo },
  };
};

export const listDeployments = async ({ set, user, headers, request, query }: any) => {
  if (!user && headers) {
    const { getUserFromRequest } = await import("../middleware/auth.ts");
    user = await getUserFromRequest(headers, request);
  }
  if (!user) {
    set.status = 401;
    return { error: "Unauthorized" };
  }
  const deployments = await prisma.deployment.findMany({
    where: { project: { userId: user.id } },
    include: { project: { select: { name: true, repo: true } } },
    orderBy: { id: "desc" },
    take: 20,
  });
  return { deployments };
};

export const listProjects = async ({ set, user, headers, request }: any) => {
  if (!user && headers) {
    const { getUserFromRequest } = await import("../middleware/auth.ts");
    user = await getUserFromRequest(headers, request);
  }
  if (!user) {
    set.status = 401;
    return { error: "Unauthorized" };
  }
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: {
      deployments: {
        orderBy: { id: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  // enrich with live URL and deployment counts
  const enriched = await Promise.all(
    projects.map(async (p) => {
      const latest = p.deployments[0] ?? null;
      const counts = await prisma.deployment.groupBy({
        by: ["status"],
        where: { projectId: p.id },
        _count: { status: true },
      });
      const statusCounts = Object.fromEntries(
        counts.map((c) => [c.status, c._count.status])
      );
      return {
        id: p.id,
        name: p.name,
        repo: p.repo,
        domain: p.domain,
        url: `http://${p.name}.localhost:3000`,
        latestDeployment: latest
          ? { id: latest.id, status: latest.status, projectId: latest.projectId }
          : null,
        totalDeployments: counts.reduce((a, b) => a + b._count.status, 0),
        statusCounts,
      };
    })
  );

  return { projects: enriched };
};