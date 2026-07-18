/**
 * Client-supplied storage paths are later passed to deleteFile/deleteFiles.
 * Without validation a user could store a path pointing at another user's or
 * product's files and have the server delete them on their behalf.
 *
 * Uploaded paths look like `${FILE_ROOT}/<scope>/<filename>`, so a path is
 * accepted only when it contains the expected scope segment and no traversal.
 */
export function isOwnedMediaPath(path: string, scopePrefix: string): boolean {
  if (path.includes("..") || path.includes("\\")) return false;
  const scope = scopePrefix.endsWith("/") ? scopePrefix : `${scopePrefix}/`;
  return path.startsWith(scope) || path.includes(`/${scope}`);
}
