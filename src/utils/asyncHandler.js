
// Higher-order function to handle asynchronous route handlers
const asyncHandler = (requestHandler)=>{
    return (req, res, next)=>{
        // Wrap the requestHandler call in a promise and handle any errors
        Promise.resolve(requestHandler(req, res, next)).catch((error)=> next(error))
        // Pass any caught errors to the next middleware
    }
}

export default asyncHandler