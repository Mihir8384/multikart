import { v2 as cloudinary } from "cloudinary";
import path from "path";
import url from "url";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const sanitizeFileName = (name) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .replace(/-+/g, "-");
};

// Upload single or multiple files (supports both file paths and buffers)
const uploadToCloudinary = async (files, folder = "default") => {
  try {
    if (!files || files.length === 0) throw new Error("No files provided");

    const uploads = await Promise.all(
      files.map(async (file) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const resourceType =
          ext === ".pdf" ? "raw" : ext === ".mp4" ? "video" : "image";
        const rawName = path.parse(file.originalname).name;
        let publicId = sanitizeFileName(rawName);
        publicId += `-${uuidv4()}`;

        const cloudinaryOptions = {
          folder,
          use_filename: true,
          unique_filename: false,
          public_id: publicId,
          resource_type: resourceType,
          format: resourceType == "raw" ? "pdf" : undefined,
        };

        let result;

        // Check if file has a buffer (for Vercel/serverless environments)
        if (file.buffer) {
          // Upload from buffer directly
          result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              cloudinaryOptions,
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(file.buffer);
          });
        } else if (file.path) {
          // Upload from file path (for local environments)
          result = await cloudinary.uploader.upload(
            file.path,
            cloudinaryOptions
          );

          // Delete the temporary file
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } else {
          throw new Error("File must have either a buffer or path property");
        }

        return result;
      })
    );

    return uploads;
  } catch (error) {
    throw new Error(`Cloudinary Upload Error: ${error.message}`);
  }
};

const extractPublicId = (fileUrl) => {
  try {
    const parsedUrl = url.parse(fileUrl);
    const pathname = parsedUrl.pathname;

    // Example pathname: /v1691512345/folder/subfolder/my-file.pdf
    const parts = pathname.split("/");
    const versionIndex = parts.findIndex((p) => /^v\d+$/.test(p)); // Find 'v1691512345'

    if (versionIndex === -1 || versionIndex + 1 >= parts.length) {
      throw new Error("Invalid Cloudinary URL format");
    }

    const publicIdWithExt = parts.slice(versionIndex + 1).join("/");
    const ext = path.extname(publicIdWithExt);
    const publicId = publicIdWithExt.replace(ext, "");

    // Infer resource type from extension
    const resourceType =
      ext === ".pdf" ? "raw" : ext === ".mp4" ? "video" : "image";

    return { publicId, resourceType };
  } catch (err) {
    throw new Error(`Error extracting public_id: ${err.message}`);
  }
};

// Delete file(s) using URLs
const deleteFromCloudinary = async (fileUrls) => {
  try {
    if (!fileUrls) throw new Error("No fileUrls provided");

    const urls = Array.isArray(fileUrls) ? fileUrls : [fileUrls];

    const deletions = await Promise.all(
      urls.map(async (fileUrl) => {
        console.log("Deleting file:", fileUrl);
        const { publicId, resourceType } = extractPublicId(fileUrl);
        return cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
        });
      })
    );

    console.log("Deletions completed:", deletions);
    return deletions;
  } catch (error) {
    throw new Error(`Cloudinary Delete Error: ${error.message}`);
  }
};

export { uploadToCloudinary, deleteFromCloudinary };
