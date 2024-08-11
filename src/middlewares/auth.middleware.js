import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// JWT ko verify karne ke liye middleware 
// agar res ka koii use nhi hota h to uski jagah pe hum ye _ dal sakte h
export const verifyJWT = asyncHandler (async (req , _ , next) => {
    try {
        // Access token ko cookies se ya Authorization header se prapt karein
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "")
    
        if (!token) {
            // Agar token nahi mila toh error throw karein
            throw new ApiError(401 , "Unauthorized request")
        }
    
        // Token ko verify karein
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        // Token se user ko dhundhein - ._id user ka h jb hum model define kiye the us waqt dale the
        //_id:this._id -> key
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        
        if (!user) {
            // Agar user nahi mila toh error throw karein
            throw new ApiError(401, "Invalid Access Token")
        }
        
        // Request object mein user ko add karein
        req.user = user;
        next();
    } catch (error) {
        // Koi error aaye toh use catch karein aur error throw karein
        throw new ApiError(401 , error?.message || "Invalid access token")
    }

})