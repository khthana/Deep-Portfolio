import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import WhiteContainer from "../../../../components/container/white-container";
import { useState } from "react";
import Button from "../../../../components/button/button";
import { Form, message, Select } from "antd";
import CourseInfoForm from "./course-info-form";
import { postCreateCourseSectionSchedule } from "../stores/teacher-course-action";
import type { CreateCourseSectionScheduleReq } from "../types/course-type.type";
import { weekdayLabel, type Weekday } from "../../../../constants/date";
import type { Dayjs } from "dayjs";
import { fetchCourseById } from "../../home/stores/teacher-home-action";

export type CourseInfoFormValues = {
  day_of_week: string;
  start_time: Dayjs;
  end_time: Dayjs;
  classroom: string;
};

const CourseInfoSection = () => {
  const dispatch = useDispatch<AppDispatch>();

  const teacherHomeSlice = useSelector((state: RootState) => state.teacherHome);
  const teacherCourseSlice = useSelector(
    (state: RootState) => state.teacherCourse,
  );

  const [courseInfoForm] = Form.useForm<CourseInfoFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const [isEditing, setIsEditing] = useState(false);

  const handleOnSubmit = async () => {
    try {
      const values = await courseInfoForm.validateFields();

      const req: CreateCourseSectionScheduleReq = {
        section_id: teacherHomeSlice.selectedCourse?.section_id ?? 0,
        day_of_week: values.day_of_week as Weekday,
        start_time: values.start_time
          ? values.start_time.format("HH:mm:ss")
          : "",
        end_time: values.end_time ? values.end_time.format("HH:mm:ss") : "",
        classroom: values.classroom,
      };

      const resp = await dispatch(
        postCreateCourseSectionSchedule(req),
      ).unwrap();

      if (resp.success) {
        await dispatch(
          fetchCourseById(teacherHomeSlice.selectedCourse?.section_id ?? 0),
        ).unwrap();
        courseInfoForm.resetFields();
        setIsEditing(false);
        messageApi.success("บันทึกข้อมูลสำเร็จ");
      }
      console.log("submit req :", resp);
    } catch (error) {
      messageApi.error("บันทึกข้อมูลไม่สำเร็จ");
    }
  };

  return (
    <WhiteContainer>
      {contextHolder}

      <div className="body-bold-1 pb-5 border-b border-light-grey flex justify-between">
        <div>รายละเอียด</div>
        {!isEditing && (
          <img
            src="/assets/course/edit-icon.svg"
            alt="edit icon"
            width={24}
            height={24}
            className="cursor-pointer"
            onClick={() => setIsEditing(true)}
          />
        )}
      </div>

      <div className="caption-regular">
        <div className="mb-2 text-secondary-blue font-bold">รายวิชา</div>
        <div>{teacherHomeSlice.selectedCourse?.course_name_en}</div>
      </div>

      <div className="grid grid-cols-3 gap-8 caption-regular">
        <div>
          <div className="mb-2 text-secondary-blue font-bold">รหัสวิชา</div>
          <div>{teacherHomeSlice.selectedCourse?.course_id}</div>
        </div>
        <div className="text-center">
          <div className="mb-2 text-secondary-blue font-bold">หน่วยกิต</div>
          <div>{teacherHomeSlice.selectedCourse?.credits}</div>
        </div>
        <div className="text-center">
          <div className="mb-2 text-secondary-blue font-bold">กลุ่มเรียน</div>
          <div>{teacherHomeSlice.selectedCourse?.section_number}</div>
        </div>
      </div>

      {!isEditing ? (
        <div className="flex flex-col 2xl:flex-row 2xl:gap-0 gap-4 caption-regular">
          <div className="w-60 2xl:w-72">
            <div className="mb-2 text-secondary-blue font-bold">
              วันและเวลาเรียน
            </div>

            <div className="flex gap-2">
              <div>
                {teacherHomeSlice.selectedCourse?.day_of_week
                  ? weekdayLabel[teacherHomeSlice.selectedCourse?.day_of_week]
                  : "ยังไม่กำหนด"}
              </div>
              <div>
                {teacherHomeSlice.selectedCourse?.start_time &&
                  teacherHomeSlice.selectedCourse?.end_time && (
                    <>
                      {teacherHomeSlice.selectedCourse?.start_time} -{" "}
                      {teacherHomeSlice.selectedCourse?.end_time}
                    </>
                  )}
              </div>
            </div>
          </div>
          <div className="flex">
            <div>
              <div className="mb-2 text-secondary-blue font-bold">
                ห้องเรียน
              </div>
              <div className="2xl:text-center">
                {teacherHomeSlice.selectedCourse?.classroom ?? "ยังไม่กำหนด"}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <CourseInfoForm
          courseInfoForm={courseInfoForm}
          handleOnSubmit={handleOnSubmit}
        />
      )}

      <div className="flex flex-col 2xl:flex-row 2xl:gap-0 gap-4 caption-regular">
        <div className="w-72">
          <div className="mb-2 text-secondary-blue font-bold">
            อาจารย์ประจำวิชา
          </div>
          <div>{teacherHomeSlice.selectedCourse?.teacher_name_th}</div>
        </div>

        <div>
          <div className="mb-2 text-secondary-blue font-bold">โทรศัพท์</div>
          <div>{teacherHomeSlice.selectedCourse?.teacher_phone ?? "-"}</div>
        </div>
      </div>

      <div className="caption-regular">
        <div className="mb-2 text-secondary-blue font-bold">email</div>
        <div>{teacherHomeSlice.selectedCourse?.teacher_email}</div>
      </div>

      {isEditing && (
        <div className="text-end w-full space-x-2 caption-regular">
          <Button
            onClick={() => {
              setIsEditing(false);
              courseInfoForm.resetFields();
            }}
            variant="secondary"
            loading={
              teacherHomeSlice.fetchCourseByIdLoading ||
              teacherCourseSlice.postCreateCourseSectionScheduleLoading
            }
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleOnSubmit}
            loading={
              teacherHomeSlice.fetchCourseByIdLoading ||
              teacherCourseSlice.postCreateCourseSectionScheduleLoading
            }
          >
            บันทึก
          </Button>
        </div>
      )}

      {teacherHomeSlice.selectedCourse?.day_of_week === null ||
      teacherHomeSlice.selectedCourse?.start_time === null ||
      teacherHomeSlice.selectedCourse?.end_time === null ||
      teacherHomeSlice.selectedCourse?.classroom === null ? (
        <div className="text-end caption-bold text-primary-red">
          กรุณากำหนดข้อมูลวัน เวลาเรียน และห้องเรียนให้เรียบร้อย
        </div>
      ) : null}
    </WhiteContainer>
  );
};

export default CourseInfoSection;
