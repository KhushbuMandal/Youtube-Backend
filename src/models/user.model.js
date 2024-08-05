import mongoose , {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

const userSchema = new Schema({
    username : {
        type : String,
        required : true,
        unique: true,
        lowercase : true,
        trim : true,
        index : true // jb kisis bhi field ko searchable banana hai to vo optimize kr deta hai
    },
    email : {
        type : String,
        required : true,
        unique: true,
        lowercase : true,
        trim : true,
    },
    fullname : {
        type : String,
        required : true,
        unique: true,
        trim : true,
    },
    avatar : {
        type : String, //cloudinary url
        required : true,
    },
    coverImage : {
        type : String,
    },
    watchHistory : [
        {
            type : Schema.Types.ObjectId,
            ref : "Video"
        }
    ],
    password : {
        type : String,
        required : [true , "Password is required"]
    },
    refreshToken : {
        type : String
    }

}, {timestamps : true});

// ye method paswword encrypt krne me help krta hai
userSchema.pre("save" , async function(next) {

    //if p/w me kuch modification hua hai tabhi jaise p/w save kr rhe hai ya update kiye tb
    if (!this.isModified("password")) return next();

    this.password=bcrypt.hash(this.password , 10)
    next();

})

//password correct hai ya nhi
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password , this.password);
}

// Generate Access and refresh Token
// nO need to add async but if you want you can add it
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id:this._id,
            email : this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {

    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )

}

export const User = mongoose.model("User" , userSchema);