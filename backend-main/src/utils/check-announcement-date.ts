export const checkIsOverAnnouncementDate = (announcement: Date | null) => {
  if (!announcement) return false;

  const now = new Date();
  const announcementDate = new Date(announcement);

  return now.getTime() >= announcementDate.getTime();
};
