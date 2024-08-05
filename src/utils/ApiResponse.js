class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        // HTTP status code
        this.statusCode = statusCode
        // Data
        this.data = data
        // Message, agar koi message provide nahi kiya gaya hai, toh "Success" hoga
        this.message = message
        // Success status, jo statusCode ke basis par decide hoga
        this.success = statusCode < 400
    }
}


export { ApiResponse }