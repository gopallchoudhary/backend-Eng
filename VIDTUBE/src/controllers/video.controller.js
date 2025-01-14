import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import {User} from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import mongoose, {isValidObjectId} from "mongoose";
import { log } from "console";

//. Get_All_Videos 
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

//. Publish a video 
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!(title && description)) {
        throw new ApiError(400, "Title and description are required")
    }

    const videoLocalPath = req.files?.video?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    //? upload on cloudinary
    let video;
    try {
        video = await uploadOnCloudinary(videoLocalPath)
    } catch (error) {
        console.log("Error in uploading video ", error);
        throw new ApiError(400, "Error in uploading the video")
    }

    let thumbnail;
    try {
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    } catch (error) {
        console.log("Thumbnail not availabe ", error)
        throw new ApiError(400, "No Thumbnail ")
    }

    //? video creation
    try {
        const video = await Video.create({
            videoFile: video?.url,
            thumbnail: thumbnail?.url || "",
            title,
            description,
            
        })
    } catch (error) {
        console.log("Error in creating video ", error)
        
        if(video) {
            await deleteFromCloudinary(video.public_id)
        }

        if(thumbnail) {
            await deleteFromCloudinary(thumbnail.public_id)
        }

        throw new ApiError(404, "Something went wrong in uploading a video")


    }
})

//. Get video by Id 
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "Video not found")
    }
})

//. Update Video 
const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail

    const { videoId } = req.params
    const {title, description, thumbnail} = req.body
    
    if(!title && !description) {
        throw new ApiError(404, "Title and description are required")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video details updated successfully "))

    

})

//. Delete Video 
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const video = await Video.findById(videoId)
    try {
        await deleteFromCloudinary(video.public_id)
    } catch (error) {
        console.log("Error in deleting the video, ERROR: ", error)
        throw new ApiError(500, "video not deleted")
    }
})

//. Toggle publish status 
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}


