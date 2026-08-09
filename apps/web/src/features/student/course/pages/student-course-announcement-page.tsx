import React, { useEffect } from "react";
import { Breadcrumb } from "antd";
import PageLayout from "../../../../components/container/page-layout";
import { fetchAllAnnouncement } from "../stores/course-action";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import AnnouncementCard from "../components/announcement-card";

const StudentCourseAnnouncementPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const courseSlice = useSelector((state: RootState) => state.studentCourse);

  const handleFetchAnnouncements = async () => {
    if (!courseSlice.selectedCourse) return;

    dispatch(fetchAllAnnouncement(courseSlice.selectedCourse.section_id));
  };

  useEffect(() => {
    handleFetchAnnouncements();
  }, [courseSlice.selectedCourse]);

  return (
    <PageLayout>
      <Breadcrumb
        className="breadcrumb-bold"
        separator=">"
        items={[
          {
            title: "USER EXPERIENCE AND USER INTERFACE DESIGN",
          },
          {
            title: "ประกาศ",
          },
        ]}
      />

      <div className="flex flex-col gap-4">
        {courseSlice.announcements &&
          courseSlice.announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.announcement_id}
              announcement={announcement}
            />
          ))}
      </div>
    </PageLayout>
  );
};

export default StudentCourseAnnouncementPage;
