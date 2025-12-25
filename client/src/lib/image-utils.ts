import heic2any from "heic2any";

export function isHeicFile(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif")
  );
}

export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    const convertedBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.85,
    });
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    const newFileName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
    return new File([blob], newFileName, { type: "image/jpeg" });
  } catch (e) {
    console.error("HEIC conversion failed:", e);
    throw new Error("Failed to convert HEIC image");
  }
}

export async function convertToJpegBase64(file: File): Promise<string> {
  let imageBlob: Blob = file;

  if (isHeicFile(file)) {
    try {
      const convertedBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.85,
      });
      imageBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    } catch (e) {
      console.error("HEIC conversion failed:", e);
      throw new Error("Failed to convert HEIC image");
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 2048;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (height / width) * maxDim;
          width = maxDim;
        } else {
          width = (width / height) * maxDim;
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.85);
      URL.revokeObjectURL(img.src);
      resolve(jpegDataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };
    img.src = URL.createObjectURL(imageBlob);
  });
}
