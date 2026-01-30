import Notification from "../models/notifications.model.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({
      message: "Couldn't fetch notifications",
      error: error.message,
    });
  }
};

export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({
      message: "Couldn't fetch notification",
      error: error.message,
    });
  }
};

export const createNotification = async (req, res) => {
  try {
    const { title, message, priority, recipient, type } = req.body;
    const newNotification = await Notification.create({
      title,
      message,
      priority,
      recipient,
      type,
    });
    res
      .status(201)
      .json({ newNotification, message: "Notification created successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Couldn't create notification",
      error: error.message,
    });
  }
};

export const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, priority, read, recipient, type } = req.body;

    const updatedNotification = await Notification.findByIdAndUpdate(
      id,
      {
        title,
        message,
        priority,
        read,
        recipient,
        type,
      },
      { new: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      updatedNotification,
      message: "Notification updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Couldn't update notification",
      error: error.message,
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNotification = await Notification.findByIdAndDelete(id);
    if (!deletedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Couldn't delete notification",
      error: error.message,
    });
  }
};

export const filterNotificationsByType = async (req, res) => {
  try {
    const { type } = req.query;
    if (!type) {
      return res
        .status(400)
        .json({ message: "Type query parameter is required" });
    }

    const notifications = await Notification.find({ type }).sort({
      createdAt: -1,
    });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({
      message: "Couldn't filter notifications",
      error: error.message,
    });
  }
};

export const getNotificationsThisMonth = async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const notifications = await Notification.find({
      createdAt: { $gte: startDate, $lt: endDate },
    }).sort({ createdAt: "asc" });

    res.status(200).json({
      message: `Notifications for ${startDate.toLocaleString("default", {
        month: "long",
      })} ${now.getFullYear()}`,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      message: "Couldn't fetch notifications for this month",
      error: error.message,
    });
  }
};

export const getNotificationsLastMonth = async (req, res) => {
  try {
    const now = new Date();
    const year =
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);

    const notifications = await Notification.find({
      createdAt: { $gte: startDate, $lt: endDate },
    }).sort({ createdAt: "asc" });

    res.status(200).json({
      message: `Notifications for ${startDate.toLocaleString("default", {
        month: "long",
      })} ${year}`,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      message: "Couldn't fetch notifications for last month",
      error: error.message,
    });
  }
};

export const getNotificationsThisYear = async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1);
    const endDate = new Date(now.getFullYear() + 1, 0, 1);

    const notifications = await Notification.find({
      createdAt: { $gte: startDate, $lt: endDate },
    }).sort({ createdAt: "asc" });

    res.status(200).json({
      message: `Notifications for the year ${now.getFullYear()}`,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      message: "Couldn't fetch notifications for this year",
      error: error.message,
    });
  }
};
