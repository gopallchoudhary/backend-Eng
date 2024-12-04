const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch
        ((err) => next(err))
    }
}

export {asyncHandler}

//? asyncHandler is higher order function, it is used for wrapping up the function so  that it can reusable for trycatch so we dont have to write try catch multiple times
//? asyncHandler is just a method