import type SftpClient from "ssh2-sftp-client";
import { internalServerError } from "../api-response";
import { optimizeImage, optimizeVideo } from "../optimize";

type UploadedFile = {
  publicUrl: string;
  path: string;
  fileName: string;
  mime: string | null;
  type: "image" | "video";
};

type UploadOptions = {
  sftp: SftpClient;
  file: File;
  folder: string;
  skipMediaFolder?: boolean;
};

const connect = async (): Promise<SftpClient> => {
  const { default: Client } = await import("ssh2-sftp-client");
  const fs = await import("fs");
  const sftp = new Client();

  try {
    await sftp.connect({
      host: process.env.SFTP_HOST!,
      port: Number(process.env.SFTP_PORT),
      username: process.env.SFTP_USER!,
      privateKey: fs.readFileSync(process.env.SFTP_PRIVATE_KEY_PATH!, "utf-8"),
      passphrase: process.env.SFTP_PASSPHRASE,
    });
  } catch (error) {
    await sftp.end().catch(() => {});
    throw internalServerError("Failed to connect to SFTP server", error);
  }
  return sftp;
};

async function cleanupEmptyFolders(sftp: SftpClient, filePath: string) {
  const fileRoot = process.env.MEDIA_REMOTE_ROOT!;
  let currentDir = filePath.substring(0, filePath.lastIndexOf("/"));

  while (
    currentDir &&
    currentDir !== fileRoot &&
    currentDir.startsWith(fileRoot)
  ) {
    const contents = await sftp.list(currentDir).catch(() => null);

    if (!contents || contents.length === 0) {
      await sftp.rmdir(currentDir).catch(() => {});
      currentDir = currentDir.substring(0, currentDir.lastIndexOf("/"));
    } else {
      break; // folder has content, stop climbing
    }
  }
}

const generateFileName = () => {
  const uniqueSuffix = crypto.randomUUID();
  const timestamp = Date.now();
  const newFileName = `${timestamp}-${uniqueSuffix}.webp`;
  return newFileName;
};

async function buildPublicUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
  const mediaRoot = process.env.MEDIA_REMOTE_ROOT!;
  const relativePath = path
    .replace(mediaRoot, "")
    .replace(/^\/+/, "")
    .replace(/\\/g, "/");
  const publicUrl = `${baseUrl}/${relativePath}`;
  return publicUrl;
}

async function uploadFile({
  sftp,
  file,
  folder,
  skipMediaFolder,
}: UploadOptions): Promise<UploadedFile> {
  try {
    const result = await detectMediaType(file);

    if (!result.isImage && !result.isVideo) {
      throw new Error(
        "Invalid media type. Only images and videos are allowed.",
      );
    }

    const processedFile = result.isImage
      ? await optimizeImage(file)
      : await optimizeVideo(file);

    const uploadFileName = generateFileName();

    const mediaFolder = result.isImage ? "images" : "videos";
    const remoteDir = skipMediaFolder
      ? `${process.env.MEDIA_REMOTE_ROOT!}/${folder}`
      : `${process.env.MEDIA_REMOTE_ROOT!}/${folder}/${mediaFolder}`;

    await sftp.put(processedFile, `${remoteDir}/${uploadFileName}`);

    const publicUrl = await buildPublicUrl(`${remoteDir}/${uploadFileName}`);

    return {
      path: `${remoteDir}/${uploadFileName}`,
      fileName: uploadFileName,
      type: result.isImage ? "image" : "video",
      mime: result.mime,
      publicUrl,
    };
  } catch (error) {
    throw internalServerError("Failed to save file", error);
  }
}

export async function detectMediaType(inputData: File) {
  let mimeType = null;

  mimeType = inputData.type;

  const isImage = mimeType ? mimeType.startsWith("image/") : false;
  const isVideo = mimeType ? mimeType.startsWith("video/") : false;

  return {
    isImage,
    isVideo,
    mime: mimeType,
  };
}

export async function uploadSingleFile(
  file: File,
  folder: string,
): Promise<UploadedFile> {
  const sftp = await connect();
  const remoteDir = `${process.env.MEDIA_REMOTE_ROOT!}/${folder}`;
  try {
    if (!(await sftp.exists(remoteDir))) {
      await sftp.mkdir(remoteDir, true);
    }
    return await uploadFile({ sftp, file, folder, skipMediaFolder: true });
  } finally {
    await sftp.end();
  }
}

export async function uploadFiles(
  files: File[],
  folder: string,
): Promise<UploadedFile[]> {
  const sftp = await connect();
  const createdDirectories = new Set<string>();

  try {
    const uploaded: UploadedFile[] = [];

    for (const file of files) {
      const result = await detectMediaType(file);
      const mediaFolder = result.isImage ? "images" : "videos";
      const remoteDir = `${process.env.MEDIA_REMOTE_ROOT!}/${folder}/${mediaFolder}`;

      if (!createdDirectories.has(remoteDir)) {
        if (!(await sftp.exists(remoteDir))) {
          await sftp.mkdir(remoteDir, true);
        }
        createdDirectories.add(remoteDir);
      }

      uploaded.push(
        await uploadFile({
          sftp,
          file,
          folder,
        }),
      );
    }

    return uploaded;
  } finally {
    await sftp.end();
  }
}

export async function deleteFile(path: string) {
  const sftp = await connect();
  try {
    const exists = await sftp.exists(path);
    if (exists === "-") {
      await sftp.delete(path);
      await cleanupEmptyFolders(sftp, path);
    }
  } catch (error) {
    throw internalServerError("Failed to delete file", error);
  } finally {
    await sftp.end();
  }
}
export async function deleteFiles(paths: string[]) {
  if (paths.length === 0) return;
  try {
    const sftp = await connect();
    try {
      await Promise.all(
        paths.map(async (path) => {
          const exists = await sftp.exists(path);
          if (exists === "-") {
            await sftp.delete(path);
            await cleanupEmptyFolders(sftp, path);
          }
        }),
      );
    } finally {
      await sftp.end();
    }
  } catch (error) {
    console.error("Failed to delete files", error);
  }
}
