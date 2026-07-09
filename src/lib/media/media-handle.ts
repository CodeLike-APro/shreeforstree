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
  file: File;
  folder: string;
};

export async function buildPublicUrl(path: string) {
  const baseUrl = process.env.MEDIA_BASE_URL;
  const mediaRoot = process.env.MEDIA_ROOT!;
  const relativePath = path.replace(mediaRoot, "").replace(/\\/g, "/");
  const publicUrl = `${baseUrl}${relativePath}`;
  return publicUrl;
}

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
    const publicUrl = await buildPublicUrl(`${remoteDir}/${uploadFileName}`);

    return {
      path: `${remoteDir}/${uploadFileName}`,
      fileName: uploadFileName,
      mime: result.mime,
      publicUrl,
    };
  } catch (error) {
    throw internalServerError("Failed to save file", error);
  } finally {
    await sftp.end();
  }
}

export async function uploadFiles(files: File[], folder: string) {
  return Promise.all(files.map((file) => uploadFile({ file, folder })));
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
