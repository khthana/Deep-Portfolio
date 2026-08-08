import { Table, type TableProps } from "antd";
import WhiteContainer from "../../../../components/container/white-container";
import { fetchStudentLessonPlanWithMaterial } from "../stores/course-action";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import type { AttachmentDetailResp } from "../../../../types/attachment-type.type";
import { getFile } from "../../../../utils/get-file";

type Props = {
  action?: boolean;
};

type DataType = {
  key: string;
  week: number;
  title: string;
  detail: string;
  activity: string[];
  lecture: AttachmentDetailResp | null;
  record: AttachmentDetailResp | null;
};

const LessonPlanTable = ({ action = false }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const courseSlice = useSelector((state: RootState) => state.studentCourse);

  const [data, setData] = useState<DataType[]>([]);

  const handleFetchData = async () => {
    if (!courseSlice.selectedCourse) return;

    const result = await dispatch(
      fetchStudentLessonPlanWithMaterial(courseSlice.selectedCourse.section_id),
    ).unwrap();

    const mappedData = result.data.map((lessonPlan) => ({
      key: lessonPlan.id.toString(),
      week: lessonPlan.week_no,
      title: lessonPlan.title ?? "",
      detail: lessonPlan.description ?? "",
      activity: lessonPlan.allActivities,
      record: lessonPlan?.course_materials?.record ?? null,
      lecture: lessonPlan?.course_materials?.lecture ?? null,
    }));

    console.log("mapdata : ", mappedData);

    setData(mappedData);
  };

  useEffect(() => {
    handleFetchData();
  }, [courseSlice.selectedCourse]);

  const columns: TableProps<DataType>["columns"] = [
    {
      title: "สัปดาห์ที่",
      dataIndex: "week",
      key: "week",
      render: (text) => <div className="caption-bold">{text}</div>,
      align: "center",
      width: 112,
    },
    {
      title: "หัวข้อ",
      dataIndex: "title",
      key: "title",
      render: (text) => <div className="text-left">{text}</div>,
      align: "center",
      width: 300,
    },
    {
      title: "เนื้อหา / กิจกรรม",
      dataIndex: "detail",
      key: "detail",
      render: (text) => <div className="text-left">{text}</div>,
      align: "center",
      width: 300,
    },
    {
      title: "งานที่มอบหมาย",
      dataIndex: "activity",
      key: "activity",
      render: (activities: string[]) => (
        <div className="text-left">
          {activities.length > 0 &&
            activities.map((activity) => <div>- {activity}</div>)}
        </div>
      ),
      align: "center",
      width: 300,
    },
    {
      title: "เอกสารประกอบการเรียน",
      dataIndex: "lecture",
      key: "lecture",
      width: 300,

      render: (attachments: AttachmentDetailResp, record: DataType) => {
        return (
          <div className="text-left flex flex-col">
            {attachments.file.length > 0 &&
              attachments.file.map((file) => (
                <a
                  href={getFile(file.file_path)}
                  target="_blank"
                  download={file.title}
                  key={file.attachment_id}
                  className="!underline"
                >
                  {file.title}
                </a>
              ))}

            {attachments.url.length > 0 &&
              attachments.url.map((url) => (
                <a
                  href={url.url}
                  target="_blank"
                  key={url.attachment_id}
                  className="!underline"
                >
                  {url.title}
                </a>
              ))}
          </div>
        );
      },
      align: "center",
    },
    {
      title: "บันทึกการสอน",
      dataIndex: "record",
      key: "record",
      width: 300,

      render: (attachments: AttachmentDetailResp, record: DataType) => {
        return (
          <div className="text-left flex flex-col">
            {attachments.file.length > 0 &&
              attachments.file.map((file) => (
                <a
                  href={getFile(file.file_path)}
                  target="_blank"
                  download={file.title}
                  key={file.attachment_id}
                  className="!underline"
                >
                  {file.title}
                </a>
              ))}

            {attachments.url.length > 0 &&
              attachments.url.map((url) => (
                <a
                  href={url.url}
                  target="_blank"
                  key={url.attachment_id}
                  className="!underline"
                >
                  {url.title}
                </a>
              ))}
          </div>
        );
      },
      align: "center",
    },
  ];

  if (action) {
    columns.push({
      title: "ดำเนินการ",
      key: "action",
      align: "center",
      render: (_, record) => (
        <div className="flex gap-4 justify-center">
          <img
            src="/assets/course/edit-icon.svg"
            alt="edit icon"
            className="cursor-pointer"
          />
          <img
            src="/assets/course/delete-icon.svg"
            alt="delete icon"
            className="cursor-pointer"
          />
        </div>
      ),
      width: 160,
    });
  }

  return (
    <WhiteContainer>
      <div className="body-bold-1 pb-5 border-b border-light-grey">
        แผนการสอน
      </div>

      <Table<DataType>
        columns={columns}
        dataSource={data}
        bordered
        rowHoverable={false}
        pagination={false}
        tableLayout="fixed"
        className={`vertical-align-top-table custom-table orange`}
        scroll={{ x: 1200 }}
      />
    </WhiteContainer>
  );
};

export default LessonPlanTable;
