import { connectDB } from "@/lib/db";
import { Notification, INotification, NotificationSeverity, NotificationEntityType } from "@/models/Notification";

export interface CreateNotificationInput {
  organizationId: string;
  userId?: string;
  type: string;
  title: string;
  message: string;
  severity?: NotificationSeverity;
  entityType?: NotificationEntityType;
  entityId: string;
}

export class NotificationService {
  /**
   * Dispatches a notification if one does not already exist for the same event and entity.
   */
  public static async dispatch(input: CreateNotificationInput): Promise<INotification> {
    await connectDB();

    // Prevent spam / duplicates
    const existing = await Notification.findOne({
      organizationId: input.organizationId,
      type: input.type,
      entityId: input.entityId,
      read: false,
    });

    if (existing) {
      return existing;
    }

    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const notification = new Notification({
      notificationId,
      userId: input.userId,
      organizationId: input.organizationId,
      type: input.type,
      title: input.title,
      message: input.message,
      severity: input.severity || "INFO",
      entityType: input.entityType || "SYSTEM",
      entityId: input.entityId,
      read: false,
    });

    await notification.save();
    return notification;
  }

  /**
   * Retrieves notifications with pagination.
   */
  public static async getNotifications(options: {
    organizationId?: string;
    unreadOnly?: boolean;
    severity?: string;
    limit?: number;
    page?: number;
  }) {
    await connectDB();
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (options.organizationId && options.organizationId !== "all") {
      query.organizationId = options.organizationId;
    }
    if (options.unreadOnly) {
      query.read = false;
    }
    if (options.severity && options.severity !== "all") {
      query.severity = options.severity;
    }

    const [total, unreadCount, items] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({ ...(options.organizationId ? { organizationId: options.organizationId } : {}), read: false }),
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return {
      items,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Marks a single notification as read.
   */
  public static async markAsRead(notificationId: string): Promise<boolean> {
    await connectDB();
    const res = await Notification.updateOne(
      { notificationId },
      { $set: { read: true } }
    );
    return res.modifiedCount > 0;
  }

  /**
   * Marks all notifications as read for an organization.
   */
  public static async markAllAsRead(organizationId: string): Promise<number> {
    await connectDB();
    const res = await Notification.updateMany(
      { organizationId, read: false },
      { $set: { read: true } }
    );
    return res.modifiedCount;
  }
}
