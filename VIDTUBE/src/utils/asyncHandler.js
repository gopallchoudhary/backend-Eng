const asyncHandler = (requestHandler) =>  {
    return (req, res, next) => {
        Promise.resolve(asyncHandler(req, res, next)).catch
        ((err) => next(err))
    }
}

export {asyncHandler}