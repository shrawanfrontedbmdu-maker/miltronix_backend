import AdminProfile from "../models/profile.model.js"
import { uploadProfileImage } from "../utils/cloudinary.js";
export const getAdminProfile = async (req, res) => {
    try {
        const profile = await AdminProfile.findOne().lean();

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Admin profile not found",
                data: [],
            });
        }

        return res.status(200).json({
            success: true,
            message: "Admin profile fetched successfully",
            data: profile,
        });

    } catch (error) {
        console.error("Get Admin Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching admin profile",
            error: error.message,
        });
    }
};
// export const upsertAdminProfile = async (req, res) => {
//     try {
//         const files = req.files;
//         const data = req.body;

//         if (files?.avatar) data.avatar = `/uploads/${files.avatar[0].filename}`;
//         if (files?.coverImage) data.coverImage = `/uploads/${files.coverImage[0].filename}`;

//         let profile = await AdminProfile.findOne();

//         if (!profile) {
//             profile = new AdminProfile(data);
//         } else {
//             Object.keys(data).forEach(key => {
//                 if (data[key] !== undefined && data[key] !== null) {
//                     profile[key] = data[key];
//                 }
//             });
//         }

//         await profile.save();

//         return res.status(200).json({
//             success: true,
//             message: "Admin profile saved successfully",
//             data: profile,
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ success: false, message: error.message });
//     }
// };


export const upsertAdminProfile = async (req, res) => {
    try {
        const files = req.files;
        const data = req.body;

        if (files?.avatar?.[0]) {
            const result = await uploadProfileImage(files.avatar[0].buffer);
            data.avatar = result.secure_url;
        }

        if (files?.coverImage?.[0]) {
            const result = await uploadProfileImage(files.coverImage[0].buffer);
            data.coverImage = result.secure_url;
        }

        let profile = await AdminProfile.findOne();

        if (!profile) {
            profile = new AdminProfile(data);
        } else {
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && data[key] !== null) {
                    profile[key] = data[key];
                }
            });
        }

        await profile.save();

        return res.status(200).json({
            success: true,
            message: "Admin profile saved successfully",
            data: profile,
        });

    } catch (error) {
        console.error("PROFILE UPDATE ERROR:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

