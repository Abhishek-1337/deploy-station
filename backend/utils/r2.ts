import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readdir, readFile, stat } from "fs/promises";
import { join, relative } from "path";
import { lookup } from "mime-types";

function getEnv(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getR2Endpoint(): string {
  // Allow either full endpoint or accountId
  if (process.env.R2_ENDPOINT) return process.env.R2_ENDPOINT;
  if (process.env.R2_ACCOUNT_ID) {
    return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }
  throw new Error("Missing env: R2_ENDPOINT or R2_ACCOUNT_ID");
}

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (s3Client) return s3Client;
  s3Client = new S3Client({
    region: "auto",
    endpoint: getR2Endpoint(),
    credentials: {
      accessKeyId: getEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: getEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
  return s3Client;
}

export function getBucketName(): string {
  return getEnv("R2_BUCKET_NAME");
}

async function collectFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await collectFiles(full)));
    } else if (e.isFile()) {
      out.push(full);
    }
  }
  return out;
}

export async function uploadDirToR2(localDir: string, deploymentId: string) {
  const bucket = getBucketName();
  const client = getS3Client();

  // Guard: empty build output
  const rootStat = await stat(localDir).catch(() => null);
  if (!rootStat?.isDirectory()) throw new Error(`Build output not found: ${localDir}`);

  const files = await collectFiles(localDir);
  if (files.length === 0) throw new Error(`No files to upload in: ${localDir}`);

  const prefix = `deployments/${deploymentId}`;

  // Upload sequentially to keep memory flat; 4-5 at-a-time is enough for SPA
  for (const filePath of files) {
    const key = `${prefix}/${relative(localDir, filePath).replace(/\\/g, "/")}`;
    const body = await readFile(filePath);
    const contentType = lookup(filePath) || "application/octet-stream";

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: contentType.startsWith("text/html") ? "no-cache" : "public, max-age=31536000, immutable",
      })
    );
    console.log(`uploaded: ${key} (${contentType})`);
  }

  return { uploaded: files.length, prefix };
}
