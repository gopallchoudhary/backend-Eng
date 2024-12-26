import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

//. Refresh and Access Token generation 
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken; //? refreshToken db me store rakhte hai taaki user se bar bar password na puchna pade
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.log("Something went wrong ", error);
    throw new ApiError(500, "something went wrong");
  }
};

//. Register_User 
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;

  //? validation
  if (
    [fullname, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //? existed user
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(400, "User with username and email already existed");
  }

  //? path
  //console.log(req.body);
  //console.log(req.files);
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // const avatar = await uploadOnCloudinary(avatarLocalPath);
  // let coverImage = "";
  // if (coverLocalPath) {
  //   coverImage = await uploadOnCloudinary(coverLocalPath);
  // }

  /// Uploading avatar
  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    //!console.log("Uploaded avatar image ", avatar);
  } catch (error) {
    console.log("Error in uploading in avatar ", error);
    throw new ApiError(500, "Failed to upload avatar");
  }
  //console.log(avatar);

  /// Uploading cover image
  let coverImage;
  try {
    coverImage = await uploadOnCloudinary(coverLocalPath);
    //!console.log("Uploaded cover image ", coverImage);
  } catch (error) {
    ///catch
    console.log("Error in uploading in cover image ", coverImage);
    throw new ApiError(500, "Failed to upload cover image");
  }
  //console.log(coverImage);

  /// Creating User
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
  } catch (error) {
    /// catch
    console.log("User creation failed");

    if (avatar) {
      await deleteFromCloudinary(avatar.public_id);
    }

    if (coverImage) {
      await deleteFromCloudinary(coverImage.public_id);
    }

    throw new ApiError(
      500,
      "Something went wrong in registering user and images were deleted"
    );
  }
});

//. Login_User 
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(email || username)) {
    throw new ApiError(500, "Email or username is required");
  }

  //? user
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "No user");
  }

  //? valid psd
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(404, "Invalid User Credential");
  }

  //? tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  // console.log("Access: ", accessToken);
  // console.log("Refresh: ", refreshToken);
  
  

  //? loggedInUser
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //? cookies security
  const options = {
    httpOnly: true,
    secure: true,
  };

  //? return
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

//. Logout_User 
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  // const {accessToken, refreshToken} = generateAccessAndRefreshTokens(user._id)
  // console.log("Access: ", accessToken);
  // console.log("Refresh: ", refreshToken);

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

//. refresh token end point 
const refreshAccessToken = asyncHandler(async (req, res) =>{

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if(!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken._id)
    if(!user) {
      throw new ApiError(401, "Invalid refresh token")
    }

    

    if(incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used")
    }

    const {accessToken, newRefreshToken } = generateAccessAndRefreshTokens(user._id)
    console.log("Access Token: ", accessToken)
    console.log("Refresh Token: ", newRefreshToken)

    const options = {
      httpOnly: true,
      secure: true
    }

    return res 
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(
        200,
        {accessToken, refreshToken: newRefreshToken},
        "Access token refreshed"
      )
    )

  } catch (error) {
    throw new ApiError(402, error?.message ||"Unauthorized access")
  }
})

//. Change current user Password 
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const {oldPassword, newPassword, confirmPassword} = req.body

  if(newPassword !== confirmPassword) {
    throw new ApiError(400, "New password does not match")
  }

  const user = await User.findById(req.user?._id)

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if(!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old Password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully"))
})



//. read_cookie 
// const readCookie = asyncHandler(async (req, res) => {
//   console.log(req.cookies);
//   res.send(req.cookies)
// })

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser };
