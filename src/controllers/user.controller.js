import  { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


/*
 * / / / / / / / / / / / / / /
 * REGISTER LOGIC
 *  / / / / / / / / / / / / / /
 */

const registerUser = asyncHandler( async (req , res) => {
    // res.status (200).json({
    //     message : "HII"
    // })

    /*Steps ->

        // Frontend se user ke details prapt karein
        // Validation - koi bhi field khali nahi hona chahiye
        // Check karein kya user pehle se maujood hai: username, email
        // Images ke liye check karein, avatar ke liye check karein
        // Cloudinary mein upload karein, avatar ko
        // User object banayein - db mein entry banayein
        // Response se password aur refresh token field ko hata dein
        // User creation ka check karein
        // Response bhejein
        
    */

        //step -1
        const { fullname , email , username , password} = req.body;
        console.log ("email : " , email);
        
        //step -2 
        if (

            [fullname , email , username , password].some((field) => field?.trim() === "")

        ) {
            throw new ApiError(400 , "All fields are required")
        }

        //step - 3
        const existedUser = User.findOne ({
            $or : [{ username } , { email }]
        })

        if (existedUser) {
            throw new ApiError(409 , "User with email or username already exists")
        }

        //step - 4
        const avatarLocalPath = req.files?.avatar[0]?.path;
        const coverImageLocalPath = req.files?.coverImage[0]?.path;

        if (!avatarLocalPath) {
            throw new ApiError (400 , "Avatar file is required");
        }

        //step - 5
        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if (!avatar){
            throw new ApiError (400 , "Avatar file is required");
        }

        //step - 6
        const user = await User.create ({
            fullname,
            avatar : avatar.url,
            coverImage : coverImage?.url || "",
            email,
            password,
            username : username.toLowerCase()
        })

        //step - 8 and 7
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )

        if (!createdUser) {
            throw new ApiError(500 , "Something went wrong while registering user")
        }

        //step - 9
        return res.status(201).json(
            new ApiResponse(200 , createdUser , "User registered Sucessfully" )
        )

})

export {
    registerUser
}