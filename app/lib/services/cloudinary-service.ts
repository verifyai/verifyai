import cloudinary from 'cloudinary';

// Configure Cloudinary with your environment variables
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(image: string): Promise<string> {
  try {
    // Check if image is already a URL (if coming from another Cloudinary upload)
    if (image.startsWith("http")) {
      return image;
    }

    // Upload the Base64 image to Cloudinary
    const result = await cloudinary.v2.uploader.upload(image, {
      folder: "screenshots", // Optional: Store images in a specific folder
      resource_type: "auto", // Automatically detects image type
    });

    return result.secure_url; // Return the URL of the uploaded image
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Failed to upload image to Cloudinary.");
  }
}
