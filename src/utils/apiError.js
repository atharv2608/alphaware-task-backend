// Function to standardize error responses with status code and message
const apiError = (res, statusCode = 500, message = "An error occurred") => {
    return res.status(statusCode).json({
        success: false,
        message
    });
};

export default apiError;
