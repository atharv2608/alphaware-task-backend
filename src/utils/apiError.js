const apiError = (res, statusCode = 500, message = "An error occurred") => {
    return res.status(statusCode).json({
        success: false,
        message
    });
};

export default apiError;
