import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

//? CLOUDINARY CONFIG
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//. UPLOAD  
const uploadOnCloudinary = async (localFilePath) => {
  // console.log("Cloudinary error", {
  //   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  //   api_key: process.env.CLOUDINARY_API_KEY,
  //   api_secret: process.env.CLOUDINARY_API_SECRET
  // });

  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("File uploaded on  cloudinary server, File src: ", response.url);
    //once uploaded we would like delete it from our server
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log("Cloudinary error: ", error);
    fs.unlinkSync(localFilePath);
    return null;
  }
};

//. DELETE  
const deleteFromCloudinary = async(publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    console.log("File deleted from cloudinary:  ", publicId);
    
  } catch (error) {
    console.log("Error in deleting cloudinary file: ", error);
    return null
    
  }
}

export { uploadOnCloudinary, deleteFromCloudinary };
