import { Worker } from "bullmq";
import fs from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const buildRepo = async (github_url: string, deploymentId: string) => {
  const buildPath = `./project-station/deployment/${deploymentId}`;
  try {
    console.log("hey")
    await fs.mkdir(buildPath, { recursive: true });

    const cmd = `docker run --rm \
    --memory="1.5g" \
    -e GITHUB_URL="${github_url}" \
    -v ${buildPath}:/workspace/output \
    my-custom-builder`;

    await execAsync(cmd);
  }
  catch(ex) {
    console.log(ex);
  }
  finally {
    // await fs.rm(buildPath, { recursive: true, force: true });
  }
}

const redisHost = process.env.REDIS_HOST ?? (process.env.NODE_ENV === "production" ? "redis" : "localhost");
const redisPort = parseInt(process.env.REDIS_PORT ?? "6379", 10);

new Worker('deploy-queue', async (job) => {
  const { github_url, userId, deploymentId } = job.data;
  await buildRepo(github_url, deploymentId);
}, {
  connection: { host: redisHost, port: redisPort, maxRetriesPerRequest: null },
  concurrency: 2,
});