import { Worker } from "bullmq";
import fs from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { resolve } from "path";
import { prisma } from "../lib/prisma.ts";
import { uploadDirToR2 } from "./r2.ts";

const execAsync = promisify(exec);

const buildRepo = async (github_url: string, deploymentId: string) => {
  const buildPath = resolve(`./project-station/deployment/${deploymentId}`);
  try {
    await prisma.deployment.update({ where: { id: deploymentId }, data: { status: "RUNNING" } });

    await fs.mkdir(buildPath, { recursive: true });

    const cmd = `docker run --rm \
    --memory="1.5g" \
    -e GITHUB_URL="${github_url}" \
    -v ${buildPath}:/workspace/output \
    my-custom-builder`;

    const { stdout, stderr } = await execAsync(cmd);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    const { uploaded } = await uploadDirToR2(buildPath, deploymentId);
    console.log(`R2 upload done: ${uploaded} files -> deployments/${deploymentId}/`);

    await prisma.deployment.update({ where: { id: deploymentId }, data: { status: "DEPLOYED" } });
  } catch (ex) {
    console.error(`build failed ${deploymentId}:`, ex);
    await prisma.deployment.update({ where: { id: deploymentId }, data: { status: "FAILED" } }).catch(() => {});
    throw ex;
  } finally {
    await fs.rm(buildPath, { recursive: true, force: true });
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