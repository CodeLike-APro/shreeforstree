import Client from "ssh2-sftp-client";
import { internalServerError } from "../api-response";
import { fileTypeFromBuffer } from "file-type";
import { optimizeImage, optimizeVideo } from "../optimize";

const connect = async (): Promise<Client> => {
  const sftp = new Client();
  try {
    await sftp.connect({
      host: process.env.HOSTINGER_SFTP_HOST,
      port: Number(process.env.HOSTINGER_SFTP_PORT),
      username: process.env.HOSTINGER_SFTP_USER,
      privateKey: process.env.HOSTINGER_SFTP_PRIVATE_KEY!.replace(/\\n/g, "\n"),
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

export async function detectMediaType(inputData: Buffer | string) {
  let mimeType = null;

  if (typeof inputData === "string") {
    const match = inputData.match(/^data:(.*?);base64,/);
    if (match) {
      mimeType = match[1];
    }
  } else if (Buffer.isBuffer(inputData)) {
    const typeInfo = await fileTypeFromBuffer(inputData);
    if (typeInfo) {
      mimeType = typeInfo.mime;
    }
  }

  const isImage = mimeType ? mimeType.startsWith("image/") : false;
  const isVideo = mimeType ? mimeType.startsWith("video/") : false;

  return {
    isImage,
    isVideo,
    mime: mimeType,
  };
}

type UploadOptions = {
  file: Buffer | string;
  folder: string;
};

export async function uploadFile({ file, folder }: UploadOptions) {
  const sftp = await connect();

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
    const remoteDir = `${folder}/${mediaFolder}`;

    if (!(await sftp.exists(remoteDir))) {
      await sftp.mkdir(remoteDir, true);
    }
    await sftp.put(processedFile, `${remoteDir}/${uploadFileName}`);

    return {
      path: `${remoteDir}/${uploadFileName}`,
      fileName: uploadFileName,
      mime: result.mime,
    };
  } catch (error) {
    throw internalServerError("Failed to save file", error);
  } finally {
    await sftp.end();
  }
}

type UploadedFile = Awaited<ReturnType<typeof uploadFile>>;

export async function uploadFiles(
  files: { file: Buffer | string; folder: string }[],
) {
  const results: UploadedFile[] = [];
  for (const file of files) {
    const result = await uploadFile(file);
    results.push(result);
  }
  return results;
}
export async function deleteFile(path: string) {
  const sftp = await connect();
  try {
    if (await sftp.exists(path)) {
      await sftp.delete(path);
    }
  } catch (error) {
    throw internalServerError("Failed to delete file", error);
  } finally {
    await sftp.end();
  }
}
export async function buildPublicUrl() {}
