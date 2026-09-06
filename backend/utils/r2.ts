import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { readdir, readFile, stat } from "fs/promises";
import { join, relative } from "path";
import { lookup } from "mime-types";

function getEnv(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getR2Endpoint(): string {
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

  const rootStat = await stat(localDir).catch(() => null);
  if (!rootStat?.isDirectory()) throw new Error(`Build output not found: ${localDir}`);

  const files = await collectFiles(localDir);
  if (files.length === 0) throw new Error(`No files to upload in: ${localDir}`);

  const prefix = `deployments/${deploymentId}`;

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
  }

  return { uploaded: files.length, prefix };
}

const ASSET_EXTENSIONS = new Set([
  "js",
  "css",
  "mjs",
  "cjs",
  "html",
  "htm",
  "json",
  "map",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "ico",
  "webp",
  "avif",
  "woff",
  "woff2",
  "ttf",
  "eot",
  "otf",
  "mp4",
  "webm",
  "txt",
  "xml",
  "webmanifest",
  "wasm",
]);

function isAssetFile(filePath: string): boolean {
  const lastSegment = filePath.split("/").pop() ?? "";
  const dotIdx = lastSegment.lastIndexOf(".");
  if (dotIdx === -1) return false;
  const ext = lastSegment.slice(dotIdx + 1).toLowerCase();
  return ASSET_EXTENSIONS.has(ext);
}

function sanitizePath(requestedPath: string): string {
  const withoutQuery = (requestedPath.split("?")[0] ?? "").split("#")[0] ?? "";
  let decoded: string;
  try {
    decoded = decodeURIComponent(withoutQuery);
  } catch {
    decoded = withoutQuery;
  }
  const trimmed = decoded.replace(/^\/+/, "").trim();
  return trimmed.replace(/\.\./g, "").replace(/\/+/g, "/");
}

function isNotFoundError(err: any): boolean {
  return (
    err?.name === "NoSuchKey" ||
    err?.Code === "NoSuchKey" ||
    err?.$metadata?.httpStatusCode === 404 ||
    err?.message?.includes("NoSuchKey")
  );
}

export type R2FileResult = {
  Body: NonNullable<Awaited<ReturnType<S3Client["send"]>>>;
  ContentType: string;
  Key: string;
  CacheControl?: string;
};


export async function getProjectFile(deploymentId: string, requestedPath: string) {
  const bucket = getBucketName();
  const client = getS3Client();
  const clean = sanitizePath(requestedPath);

  const indexKey = `deployments/${deploymentId}/index.html`;

  if (!clean || clean === "/") {
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: indexKey }));
    if (!res.Body) throw new Error(`index.html not found for deployment: ${deploymentId}`);
    const contentType = res.ContentType || lookup(indexKey) || "text/html";
    return {
      Body: res.Body,
      ContentType: contentType,
      Key: indexKey,
      CacheControl: res.CacheControl ?? "no-cache",
      ETag: res.ETag,
    };
  }

  const hasAssetExt = isAssetFile(clean);
  const requestedKey = `deployments/${deploymentId}/${clean}`;

  if (!hasAssetExt) {
    try {
      const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: requestedKey }));
      if (res.Body) {
        const ct = res.ContentType || lookup(requestedKey) || "application/octet-stream";
        return { Body: res.Body, ContentType: ct, Key: requestedKey, CacheControl: res.CacheControl, ETag: res.ETag };
      }
    } catch (err: any) {
      if (!isNotFoundError(err)) throw err;
    }
    const fallback = await client.send(new GetObjectCommand({ Bucket: bucket, Key: indexKey }));
    if (!fallback.Body) throw new Error(`index.html not found for deployment: ${deploymentId}`);
    const ct = fallback.ContentType || lookup(indexKey) || "text/html";
    return {
      Body: fallback.Body,
      ContentType: ct,
      Key: indexKey,
      CacheControl: fallback.CacheControl ?? "no-cache",
      ETag: fallback.ETag,
    };
  }

  try {
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: requestedKey }));
    if (!res.Body) throw new Error(`Empty body for key: ${requestedKey}`);
    const ct = res.ContentType || lookup(requestedKey) || "application/octet-stream";
    return {
      Body: res.Body,
      ContentType: ct,
      Key: requestedKey,
      CacheControl: res.CacheControl ?? (ct.startsWith("text/html") ? "no-cache" : "public, max-age=31536000, immutable"),
      ETag: res.ETag,
    };
  } catch (err: any) {
    if (isNotFoundError(err)) {
      throw new Error(`File not found: ${requestedKey}`);
    }
    throw err;
  }
}

export async function serveProjectFile(deploymentId: string, requestedPath: string): Promise<Response> {
  const file = await getProjectFile(deploymentId, requestedPath);
  return new Response(file.Body as any, {
    status: 200,
    headers: {
      "Content-Type": file.ContentType,
      "Cache-Control": file.CacheControl ?? "",
      ...(file.ETag ? { ETag: file.ETag } : {}),
    },
  });
}
