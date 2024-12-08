const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, username } = req.body;
  
    //? validation
    if (
      [fullName, email, username, password].some((field) => field?.trim() === "")
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
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverLocalPath = req.files?.coverImage[0].path;
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing");
    }
  
    const avatar = await uploadOnCloudinary(avatarLocalPath);
  
    let coverImage = "";
    if (coverLocalPath) {
      coverImage = await uploadOnCloudinaryl(coverLocalPath);
    }
  
    //? create user
    const user = await User.create({
      fullName,
      email,
      password,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      username: username.toLowerCase()
    })
  });