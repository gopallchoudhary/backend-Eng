import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;

  //? validation
  if (
    [fullname, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //? existed user
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email and username already existed");
  }

  //? path
  //console.log(req.body);

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  // const avatar = await uploadOnCloudinary(avatarLocalPath);
  // let coverImage = "";
  // if (coverLocalPath) {
  //   coverImage = await uploadOnCloudinary(coverLocalPath);
  // }

  //. Uploading avatar 
  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    //!console.log("Uploaded avatar image ", avatar);
  } catch (error) {
    console.log("Error in uploading in avatar ", error);
    throw new ApiError(500, "Failed to upload avatar");
  }


  //. Uploading avatar 
  let coverImage;
  try { 
    coverImage = await uploadOnCloudinary(coverLocalPath);
    //!console.log("Uploaded cover image ", coverImage);
  } catch (error) { ///catch 
    console.log("Error in uploading in cover image ", coverImage);
    throw new ApiError(500, "Failed to upload cover image");
  }


  //. Creating User  
  try {
    //? create user
    const user = await User.create({
      fullname,
      email,
      password,
      username: username.toLowerCase(),
      avatar: avatar?.url,
      coverImage: coverImage?.url || "",
    });

    //? find user by id
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering a user");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered successfully"));

  } catch (error) { /// catch  
      console.log("User creation failed");

      if(avatar) {
        await deleteFromCloudinary(avatar.public_id)
      }

      if(coverImage) {
        await deleteFromCloudinary(coverImage.public_id)
      }

      throw new ApiError(500, "Something went wrong in registering user and images were deleted")
      
  }
});
export { registerUser };
