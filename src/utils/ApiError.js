class ApiError extends Error {
    constructor(
        statusCode,      // HTTP status code jise set karna hai
        message = "Something went wrong",  // Error message, agar koi message provide nahi kiya gaya hai
        errors = [],     // Anya errors, agar koi hota hai
        stack = ""       // Stack trace, agar available hai
    ){
        super(message)  // Base class ka constructor ko call karein . Basically override kiya constructor ko

        // Error object ko set karein
        this.statusCode = statusCode  // HTTP status code
        this.data = null  // Data, agar kuch specific data set karna ho
        this.message = message  // Error message
        this.success = false  // Success status, yahan toh error hai, isliye false
        this.errors = errors  // Anya errors

        // Agar stack trace available hai, toh set karein, nahi toh naya stack trace generate karein
        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}


export {ApiError}