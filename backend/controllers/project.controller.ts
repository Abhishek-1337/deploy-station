import { prisma } from "../lib/prisma";
import { deployQueue } from "../utils/queue";


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

export const deployProject = async ({body, set}: any) => {
  const { github_url } = body;

  if(github_url.strip() === "") {
    set.status = 400;
    return {
      message: "You need to input github url to deploy the project."
    }
  }

  const validityRes = await validateGithubUrl(github_url);

  if(!validityRes.isValid) {
    set.status = 400;
    return {
      message: "Invalid url."
    }
  }

  const project = await prisma.project.create({
    data: {
      name: validityRes.projectName as string
    }
  });

  const deployment = await prisma.deployment.create({
    data: {
      repo: github_url,
      projectId: project.id,
      status: "QUEUED"
    }
  });

  deployQueue.add("deploy-job", {
    github_url
  },
  {
    jobId: deployment.id
  });

  set.status = 200;
  return {
    status: "QUEUED",
    message: "Project is being deployed wait."
   };
};