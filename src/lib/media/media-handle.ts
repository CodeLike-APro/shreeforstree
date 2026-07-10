import Client from "ssh2-sftp-client";
import { internalServerError } from "../api-response";
import { optimizeImage, optimizeVideo } from "../optimize";

const connect = async (): Promise<Client> => {
  const sftp = new Client();
  try {
    await sftp.connect({
      host: process.env.HOSTINGER_SFTP_HOST,
      port: Number(process.env.HOSTINGER_SFTP_PORT),
      username: process.env.HOSTINGER_SFTP_USER,
      privateKey: process.env.HOSTINGER_SFTP_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      passphrase: process.env.HOSTINGER_SFTP_PASSPHRASE,
    });
  } catch (err) {
    await sftp.end().catch(() => {});

    throw internalServerError("Failed to connect to SFTP server", err);
  }
  return sftp;
};

const generateFileName = () => {
  const uniqueSuffix = crypto.randomUUID();
  const timestamp = Date.now();
  const newFileName = `${timestamp}-${uniqueSuffix}.webp`;
  return newFileName;
};

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

type UploadOptions = {
  sftp: Client;
  file: File;
  folder: string;
};

export async function buildPublicUrl(path: string) {
  const baseUrl = process.env.MEDIA_BASE_URL;
  const mediaRoot = process.env.FILE_ROOT!;
  const relativePath = path
    .replace(mediaRoot, "")
    .replace(/^\/+/, "")
    .replace(/\\/g, "/");
  const publicUrl = `${baseUrl}/${relativePath}`;
  return publicUrl;
}

type UploadedFile = {
  publicUrl: string;
  path: string;
  fileName: string;
  mime: string | null;
  type: "image" | "video";
};

export async function uploadFile({
  sftp,
  file,
  folder,
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
    const remoteDir = `${process.env.FILE_ROOT!}/${folder}/${mediaFolder}`;

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
      const remoteDir = `${process.env.FILE_ROOT!}/${folder}/${mediaFolder}`;

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
    }
  } catch (error) {
    throw internalServerError("Failed to delete file", error);
  } finally {
    await sftp.end();
  }
}
export async function deleteFiles(paths: string[]) {
  await Promise.all(paths.map((path) => deleteFile(path)));
}
