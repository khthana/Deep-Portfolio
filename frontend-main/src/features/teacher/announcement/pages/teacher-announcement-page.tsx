import CreateAnnouncementButton from "../components/create-announcement-button";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import AnnouncementCard from "../../../student/course/components/announcement-card";
import TeacherBreadcrumb from "../../../../components/breadcrumb/teacher-breadcrumb";
import { fetchAllAnnouncements } from "../stores/announcement-action";
import { useEffect } from "react";
import PageLayout from "../../../../components/container/page-layout";

const TeacherAnnouncementPage = () => {
  const dispatch = useDispatch<AppDispatch>();

  const announcementSlice = useSelector(
    (state: RootState) => state.teacherAnnouncement
  );
  const homeSlice = useSelector((state: RootState) => state.teacherHome);

  const handleFetchAnnouncements = async () => {
    if (!homeSlice.selectedCourse) return;

    dispatch(fetchAllAnnouncements(homeSlice.selectedCourse.section_id));
  };

  useEffect(() => {
    handleFetchAnnouncements();
  }, [homeSlice.selectedCourse]);

  return (
    <PageLayout>
      <TeacherBreadcrumb title="ประกาศ" />
      
      <div className="flex flex-col gap-4">
        {announcementSlice.announcements && announcementSlice.announcements.length > 0?
          announcementSlice.announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.announcement_id}
              announcement={announcement}
            />
          )) : <p className="caption-bold text-primary-red">ยังไม่มีประกาศ</p>}
      </div>

      <CreateAnnouncementButton />
    </PageLayout>
  );
};

export default TeacherAnnouncementPage;
