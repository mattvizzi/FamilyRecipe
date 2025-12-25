import { ObjectStorageService, objectStorageClient } from "./replit_integrations/object_storage/objectStorage";
import { randomUUID } from "crypto";

const objectStorageService = new ObjectStorageService();

/**
 * Upload a base64 image to Object Storage and return the public URL path.
 * Used for AI-generated recipe images.
 * 
 * @param base64Data - Base64 encoded image data (with or without data URL prefix)
 * @param recipeId - Recipe ID for generating unique filename
 * @returns Object path that can be used to access the image (e.g., /objects/uploads/recipe-123-uuid)
 */
export async function uploadRecipeImage(
  base64Data: string,
  recipeId: string
): Promise<string> {
  // Extract the base64 content (remove data URL prefix if present)
  let imageBuffer: Buffer;
  let contentType = "image/png";
  
  if (base64Data.startsWith("data:")) {
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      contentType = matches[1];
      imageBuffer = Buffer.from(matches[2], "base64");
    } else {
      throw new Error("Invalid base64 data URL format");
    }
  } else {
    imageBuffer = Buffer.from(base64Data, "base64");
  }

  // Get the private object directory and create a path for recipe images
  const privateDir = objectStorageService.getPrivateObjectDir();
  const objectId = `recipe-${recipeId}-${randomUUID()}`;
  const fullPath = `${privateDir}/uploads/${objectId}`;

  // Parse the path to get bucket and object name
  const pathParts = fullPath.startsWith("/") ? fullPath.slice(1).split("/") : fullPath.split("/");
  if (pathParts.length < 2) {
    throw new Error("Invalid storage path configuration");
  }
  
  const bucketName = pathParts[0];
  const objectName = pathParts.slice(1).join("/");
  
  // Upload the image directly to GCS
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);
  
  await file.save(imageBuffer, {
    contentType,
    resumable: false,
    metadata: {
      cacheControl: "public, max-age=31536000", // Cache for 1 year
    },
  });

  // Return the normalized object path that can be served via /objects/* route
  return `/objects/uploads/${objectId}`;
}

/**
 * Check if a URL is a base64 data URL (needs migration to Object Storage)
 */
export function isBase64Image(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith("data:image");
}

/**
 * Get the full URL for serving an object storage image.
 * For now, we serve through the /objects/* route.
 */
export function getImageUrl(objectPath: string): string {
  // If it's already a full URL or base64, return as-is
  if (objectPath.startsWith("http") || objectPath.startsWith("data:")) {
    return objectPath;
  }
  // Object paths like /objects/uploads/uuid are served through our route
  return objectPath;
}
