import { v2  as cloudinary} from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});    

const uploadOnCloudinary = async (localFilePath) => {
    try {
        //agr server ka local file path nhi mila to chup chap return ho jayenge
        if (!localFilePath) return null;

        //upload the file in cloudinary
        const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type : "auto"
        })
        
        //file has been uploaded successfull
        console.log("File is uploaded on cloudinary" , response.url);

        return response;

    } catch (error) {

        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operations got failed
        return null;
        
    }
}

export {uploadOnCloudinary}
