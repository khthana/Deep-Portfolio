import { useSelector } from "react-redux";
import WhiteContainer from "../../../../components/container/white-container";
import type { RootState } from "../../../../stores/stores";
import { weekdayLabel } from "../../../../constants/date";

const CourseInfoSection = () => {
  const courseSlice = useSelector((state: RootState) => state.studentCourse);

  return (
    <WhiteContainer>
      <div className="body-bold-1 pb-5 border-b border-light-grey">
        รายละเอียด
      </div>

      <div className="caption-regular">
        <div className="mb-2 text-primary-orange font-bold">รายวิชา</div>
        <div>{courseSlice.selectedCourse?.course_name_en}</div>
      </div>

      <div className="grid grid-cols-3 gap-0 caption-regular">
        <div>
          <div className="mb-2 text-primary-orange font-bold">รหัสวิชา</div>
          <div>{courseSlice.selectedCourse?.course_id}</div>
        </div>
        <div className="text-center">
          <div className="mb-2 text-primary-orange font-bold">หน่วยกิต</div>
          <div>{courseSlice.selectedCourse?.credits}</div>
        </div>
        <div className="text-center">
          <div className="mb-2 text-primary-orange font-bold">กลุ่มเรียน</div>
          <div>{courseSlice.selectedCourse?.section_number}</div>
        </div>
      </div>

      <div className="flex flex-col 2xl:flex-row 2xl:gap-0 gap-4 caption-regular">
        <div className="w-60 2xl:w-78">
          {/* todo: ยังไม่แน่ใจว่าถ้ารวมทฤษฎีกะปฏิบัติเข้าด้วยกันแล้วเวลาแสดงข้อมูลพวกนี้ เช่น รหัสวิชา หน่วยกิต จะต้องแสดงของอะไร */}
          <div className="mb-2 text-primary-orange font-bold">
            วันและเวลาเรียน
          </div>
          <div className="flex gap-2">
            <div>
              {courseSlice.selectedCourse?.day_of_week
                ? weekdayLabel[courseSlice.selectedCourse?.day_of_week]
                : "ยังไม่กำหนด"}
            </div>
            <div>
              {courseSlice.selectedCourse?.start_time &&
                courseSlice.selectedCourse?.end_time && (
                  <>
                    {courseSlice.selectedCourse?.start_time} -{" "}
                    {courseSlice.selectedCourse?.end_time}
                  </>
                )}
            </div>
          </div>
        </div>
        <div className="flex">
          <div>
            <div className="mb-2 text-primary-orange font-bold">ห้องเรียน</div>
            <div className="2xl:text-center">
              {courseSlice.selectedCourse?.classroom ?? "ยังไม่กำหนด"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col 2xl:flex-row 2xl:gap-0 gap-4 caption-regular">
        <div className="w-78">
          <div className="mb-2 text-primary-orange font-bold">
            อาจารย์ประจำวิชา
          </div>
          <div>{courseSlice.selectedCourse?.teacher_name_th}</div>
        </div>

        <div>
          <div className="mb-2 text-primary-orange font-bold">โทรศัพท์</div>
          <div>{courseSlice.selectedCourse?.teacher_phone ?? "-"}</div>
        </div>
      </div>

      <div>
        <div className="mb-2 text-primary-orange font-bold">email</div>
        <div>{courseSlice.selectedCourse?.teacher_email}</div>
      </div>
    </WhiteContainer>
  );
};

export default CourseInfoSection;
