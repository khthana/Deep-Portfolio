import { Form, Input, Select, TimePicker, type FormInstance } from "antd";
import { weekdayOptions } from "../../../../constants/date";
import type { CourseInfoFormValues } from "./course-info-section";
import type { RootState } from "../../../../stores/stores";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

type Props = {
  handleOnSubmit: (values: CourseInfoFormValues) => void;
  courseInfoForm: FormInstance<CourseInfoFormValues>;
};

const CourseInfoForm = (props: Props) => {
  const teacherHomeSlice = useSelector((state: RootState) => state.teacherHome);

  const initFormValues = () => {
    props.courseInfoForm.setFieldsValue({
      day_of_week: teacherHomeSlice.selectedCourse?.day_of_week ?? undefined,
      start_time: teacherHomeSlice.selectedCourse?.start_time
        ? dayjs(teacherHomeSlice.selectedCourse?.start_time, [
            "HH:mm:ss",
            "HH:mm",
          ])
        : undefined,
      end_time: teacherHomeSlice.selectedCourse?.end_time
        ? dayjs(teacherHomeSlice.selectedCourse?.end_time, [
            "HH:mm:ss",
            "HH:mm",
          ])
        : undefined,
      classroom: teacherHomeSlice.selectedCourse?.classroom ?? "",
    });
  };

  initFormValues();

  return (
    <Form
      layout="vertical"
      className="w-full"
      form={props.courseInfoForm}
      onFinish={props.handleOnSubmit}
    >
      <div className="2xl:grid 2xl:grid-cols-3 grid gap-4 caption-regular">
        <div className="col-span-2">
          <div className="mb-2 text-secondary-blue font-bold">
            วันที่และเวลาเรียน
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="day_of_week" noStyle>
              <Select
                options={weekdayOptions}
                placeholder="วัน"
                // defaultValue={teacherHomeSlice.selectedCourse?.day_of_week}
              />
            </Form.Item>
            <Form.Item name="start_time" noStyle>
              <TimePicker
                format="HH:mm"
                placeholder="เริ่ม"
                // defaultValue={
                //   teacherHomeSlice.selectedCourse?.start_time
                //     ? dayjs(teacherHomeSlice.selectedCourse?.start_time, [
                //         "HH:mm:ss",
                //         "HH:mm",
                //       ])
                //     : undefined
                // }
              />
            </Form.Item>
            <Form.Item name="end_time" noStyle>
              <TimePicker
                format="HH:mm"
                placeholder="สิ้นสุด"
                // defaultValue={
                //   teacherHomeSlice.selectedCourse?.end_time
                //     ? dayjs(teacherHomeSlice.selectedCourse?.end_time, [
                //         "HH:mm:ss",
                //         "HH:mm",
                //       ])
                //     : undefined
                // }
              />
            </Form.Item>
          </div>
        </div>

        <div>
          <div>
            <div className="mb-2 text-secondary-blue font-bold">ห้องเรียน</div>
            <Form.Item name="classroom" noStyle>
              <Input
              // defaultValue={teacherHomeSlice.selectedCourse?.classroom ?? ""}
              />
            </Form.Item>
          </div>
        </div>
      </div>
    </Form>
  );
};

export default CourseInfoForm;
