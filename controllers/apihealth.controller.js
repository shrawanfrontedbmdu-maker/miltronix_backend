import mongoose from "mongoose";
export const apihealthf = async (req, res) => {
    try {
        await mongoose.connection.db.admin().ping()
        res.json({
            status: 'ok',
            server: 'running',
            database: 'connected',
            message: "Server is Running"
        })
    } catch (e) {
        return res.status(500).json({
            success: false,
            message: "Problem In Api Health"
        });
    }
}