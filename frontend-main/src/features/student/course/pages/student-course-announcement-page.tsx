import React, { useEffect } from "react";
import AnnouncementCardMock from "../components/announcement-card-mock";
import type { AnnouncementDetail } from "../types/course-type";
import { Breadcrumb } from "antd";
import PageLayout from "../../../../components/container/page-layout";
import { fetchAllAnnouncement } from "../stores/course-action";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import AnnouncementCard from "../components/announcement-card";

const mockAnnouncementData: AnnouncementDetail[] = [
  {
    title: "เลื่อนกำหนดส่งงาน UI จาก 7 ส.ค. → 10 ส.ค.",
    detail:
      "เพื่อให้นักศึกษามีเวลาในการแก้ไขตามคำแนะนำจากเพื่อนเพิ่มเติม อาจารย์ขอเลื่อนวันส่งงาน Assignment 1 (UI Sign in/out) ไปเป็นวันเสาร์ที่ 10 สิงหาคม 2568 เวลา 23:59 น.",
    dateTime: "30 ก.ค. 2568, 18:00",
  },
  {
    title: "แจ้งเตือนนักศึกษาที่ยังไม่ส่งงาน",
    detail:
      "มีนักศึกษาจำนวน 6 คน ที่ยังไม่ส่ง Assignment 1 ภายในเวลาที่กำหนด โปรดดำเนินการส่งภายในวันนี้ ก่อนเวลา 23:59 น. หากมีเหตุผลกรุณาแจ้งผ่านทางกลุ่ม LINE หรืออีเมลอาจารย์",
    dateTime: "30 ก.ค. 2568, 12:00",
    file: true,
  },
];

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
