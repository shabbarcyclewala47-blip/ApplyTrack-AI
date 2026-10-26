import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "./api";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");

    try {
      const data = await apiRequest("notifications/");

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.notifications)
          ? data.notifications
          : Array.isArray(data?.results)
            ? data.results
            : [];

      const count =
        typeof data?.unread_count === "number"
          ? data.unread_count
          : items.filter((item) => !item.is_read).length;

      setNotifications(items);
      setUnreadCount(count);

      window.dispatchEvent(
        new CustomEvent("applytrack:notifications-updated", {
          detail: {
            unreadCount: count,
            notifications: items,
          },
        })
      );
    } catch (err) {
      setError(err.message || "Could not load notifications.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadNotifications(false);
      }
    }, 15000);

    const handleFocus = () => loadNotifications(false);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadNotifications(false);
      }
    };

    const handleCountRefresh = () => {
      loadNotifications(false);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener(
      "applytrack:notification-count-refresh",
      handleCountRefresh
    );
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(
        "applytrack:notification-count-refresh",
        handleCountRefresh
      );
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [loadNotifications]);

  async function markAsRead(notification) {
    if (notification.is_read) return;

    const previousCount = unreadCount;

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, is_read: true }
          : item
      )
    );

    setUnreadCount((count) => Math.max(0, count - 1));

    window.dispatchEvent(
      new CustomEvent("applytrack:notifications-updated", {
        detail: {
          unreadCount: Math.max(0, previousCount - 1),
        },
      })
    );

    try {
      await apiRequest(`notifications/${notification.id}/read/`, {
        method: "PATCH",
      });

      window.dispatchEvent(
        new CustomEvent("applytrack:notification-read", {
          detail: { notificationId: notification.id },
        })
      );

      // Confirm the count against the server.
      await loadNotifications(false);
    } catch (err) {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: false }
            : item
        )
      );

      setUnreadCount(previousCount);

      window.dispatchEvent(
        new CustomEvent("applytrack:notifications-updated", {
          detail: { unreadCount: previousCount },
        })
      );

      setError(
        err.message || "Could not mark notification as read."
      );
    }
  }

  return (
    <div className="at-notifications">
      <button
        type="button"
        className="at-notification-bell"
        onClick={() => {
          const nextOpen = !isOpen;
          setIsOpen(nextOpen);

          if (nextOpen) {
            loadNotifications();
          }
        }}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
      >
        <span aria-hidden="true">🔔</span>

        {unreadCount > 0 && (
          <span className="at-notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="at-notification-panel">
          <div className="at-notification-header">
            <div>
              <h3>Notifications</h3>
              <p>{unreadCount} unread</p>
            </div>

            <button
              type="button"
              className="at-notification-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
            >
              ×
            </button>
          </div>

          {loading && notifications.length === 0 && (
            <p className="at-notification-message">
              Loading notifications…
            </p>
          )}

          {error && (
            <p className="at-notification-error" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className="at-notification-empty">
              <span>🔔</span>
              <strong>You're all caught up!</strong>
              <p>
                New job opportunities and interview updates will
                appear here.
              </p>
            </div>
          )}

          <div className="at-notification-list">
            {notifications.map((notification) => (
              <button
                type="button"
                key={notification.id}
                className={`at-notification-item ${
                  notification.is_read ? "" : "unread"
                }`}
                onClick={() => markAsRead(notification)}
              >
                <span className="at-notification-icon">
                  {notification.notification_type === "job_published"
                    ? "💼"
                    : notification.notification_type ===
                        "interview_scheduled"
                      ? "📅"
                      : notification.notification_type ===
                          "interview_cancelled"
                        ? "❌"
                        : notification.notification_type ===
                            "interview_updated"
                          ? "🎯"
                          : notification.notification_type ===
                              "application_received"
                            ? "📩"
                            : "📋"}
                </span>

                <span className="at-notification-content">
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <small>
                    {notification.created_at
                      ? new Date(
                          notification.created_at
                        ).toLocaleString()
                      : ""}
                  </small>
                </span>

                {!notification.is_read && (
                  <span
                    className="at-notification-unread-dot"
                    aria-label="Unread"
                  />
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="at-notification-refresh"
            onClick={() => loadNotifications()}
            disabled={loading}
          >
            {loading
              ? "Refreshing…"
              : "Refresh notifications"}
          </button>
        </div>
      )}
    </div>
  );
}