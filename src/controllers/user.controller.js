import  { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";



/*
 * / / / / / / / / / / / / / /
 * GENERATE ACCESS AND REFRESH TOKEN - LOGIN CONTROLLER
 *  / / / / / / / / / / / / / /
 */

const generateAccessAndRefreshTokens = async (userId) =>{
    try {
        // User ko userId se dhundhein
        const user = await User.findById(userId);

        // Access token aur refresh token generate karein
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // Refresh token ko user object mein save karein
        user.refreshToken = refreshToken;
        //Save kr lia database me
        await user.save({ validateBeforeSave : false });

        return {accessToken , refreshToken}


    } catch (error) {
        throw new ApiError (500 , "Something went wrong while generating refresh and access token")
    }
}

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
        //console.log ("req.body ->" , req.body)
        console.log ("email : " , email);
        
        //step -2 
        if (

            [fullname , email , username , password].some((field) => field?.trim() === "")

        ) {
            throw new ApiError(400 , "All fields are required")
            
        }

        //step - 3
        const existedUser = await User.findOne ({
            $or : [{ username } , { email }]
        })

        if (existedUser) {
            throw new ApiError(409 , "User with email or username already exists")
        }

        console.log (req.files)

        //step - 4
        const avatarLocalPath = req.files?.avatar[0]?.path;
        // const coverImageLocalPath = req.files?.coverImage[0]?.path;

        let coverImageLocalPath;
        if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
            coverImageLocalPath = req.files.coverImage[0].path;
        }

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
            
            avatar : avatar.url,
            coverImage : coverImage?.url || "",
            email,
            password,
            fullname,
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


/*
 * / / / / / / / / / / / / / /
 * LOGIN LOGIC
 *  / / / / / / / / / / / / / /
 */

const loginUser = asyncHandler ( async (req , res) => {
    // req.body se data prapt karein
    // username aur email khali nahi hone chahiye
    // username aur email dhundhein -> find user 
    // password sahi hai ya nahi check karein
    // refresh token generate karein
    // access token generate karein
    // cookie bhejein

    //step 1 
    const {email , username , password} = req.body;

    // step - 2
    if (!username && !email) {
        throw new ApiError(400, "Username and password is required");
    }
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")

    // }

    //step-3 
    const user = await User.findOne ({
        $or : [{username}  , {email}]
    })

    //user mila hi nhi 
    if (!user) {
        throw new ApiError(404 , "User does not exist")
    }

    //step - 4
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401 , "Invalid user credentials")
    }

    //step -5  & 6
    const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id)

    //optional
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


    //step - 7
    const options = {
        httpOnly : true,
        secure : true
    }

    // response bhej rhe hai ki logged in ho gye hai
    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser , accessToken , refreshToken
            },
            "User logged In Sucessfully"
        )
    )
})

/*
  * / / / / / / / / / / / / / /
 * LOGOUT LOGIC
 *  / / / / / / / / / / / / / /
 */

const logoutUser = asyncHandler( async (req, res) => {
    //req.user._id
    //User ke ID ke basis par refreshToken ko unset karein
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    // Cookie options
    const options = {
        httpOnly: true, // HTTP only cookie, JavaScript ke through access nahi hoga
        secure: true    // Secure cookie, HTTPS ke through hi access hoga
    }

    // Success response bhejein, aur cookies ko clear karein
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))


})


/* / / / / / / / / / / / / / /
* REFRESH TOKEN LOGIC - LIFE SPAIN OF ACCESS TOKEN 
*  / / / / / / / / / / / / / /
*/
const refreshAccessToken  = asyncHandler( async (req , res) => {
    // Incoming refresh token ko cookies ya req.body se prapt karein
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        // Agar refresh token nahi mila toh error throw karein
        throw new ApiError (401 , "Unauthorized request")
    }

    try {
        // Refresh token ko verify karein
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user){
            // Agar user nahi mila toh error throw karein
            throw new ApiError(401 , "Inavalid refresh Token")
        }
    
        //ab hamara incomingRefreshToken and user humne nikal liya upar and to user.model me humne to refreshToken likha hai vo hona chahiye vo dono same hai nhi hai to error throw krege
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401 , "Refresh token is expired or used")
        }
    
        // Cookie options
        const options = {
            httpOnly: true, // HTTP only cookie, JavaScript ke through access nahi hoga
            secure: true    // Secure cookie, HTTPS ke through hi access hoga
        }
    
        // Naya access token aur refresh token generate karein
        const {  accessToken , newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken" , accessToken , options)
        .cookie("newRefreshToken" , newRefreshToken , options)
        .json (
            new ApiResponse (
                200,
                {
                    accessToken , refreshToken , newRefreshToken
                },
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid Refresh Token")
    }
})


/*
  * / / / / / / / / / / / / / /
 * CHANGE USER CURRENT PASSWORD
 *  / / / / / / / / / / / / / /
 */

const changeCurrentPassword = asyncHandler( async (req,res) => {
    const {oldPassword,  newPassword } = req.body;


    //User find krna hoga tabhi databse me us user ka password update ke sake 
    const user = await User.findById(req.user?._id)
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordValid) {
        throw new ApiError (400 , "Inavalid old Password ")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave : false});

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


/*
  * / / / / / / / / / / / / / /
 * get current user
 *  / / / / / / / / / / / / / /
 */

const getCurrentUser  = asyncHandler (async (req,res) => {

    const user = await User.findById(req.user?._id).select("-password -refreshToken")
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    return res
    .status(200)
    .json(200 , user , "Current user fetced successfully")
})


/*
  * / / / / / / / / / / / / / /
 * update account details
 *  / / / / / / / / / / / / / /
 */

const updateAccountDetails = asyncHandler ( async (req, res) => {
    const {fullname , email} = req.body;

    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }


    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email : email
            }
        },
        {
            new : true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))


})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
}