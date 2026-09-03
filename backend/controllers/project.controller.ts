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

  // await prisma.project.findFirst({
  //   where: {
      
  //   }
  // })

  const validityRes = await validateGithubUrl(github_url);

  if (!validityRes.isValid) {
    set.status = 400;
    return {
      message: validityRes.error ?? "Invalid url.",
    };
  }

  const project = await prisma.project.create({
    data: {
      name: validityRes.projectName as string,
      repo: github_url,
      userId: user.id,
    },
  });

  const deployment = await prisma.deployment.create({
    data: {
      projectId: project.id,
      status: "QUEUED",
    },
  });

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

  set.status = 200;
  return {
    status: "QUEUED",
    message: "Project is being deployed wait.",
    projectId: project.id,
    deploymentId: deployment.id,
  };
};