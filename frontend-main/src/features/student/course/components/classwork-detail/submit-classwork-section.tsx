import { message, Popconfirm } from "antd";
import Button from "../../../../../components/button/button";
import { AttachmentType } from "../../../../../types/attachment-type.type";
import { useEffect, useMemo, useState } from "react";
import type { AttachmentDetailItem } from "../../../../teacher/announcement/types/announement-type";
import PreviewFiles from "../preview-files";
import type { AppDispatch, RootState } from "../../../../../stores/stores";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStudentActivityGroup,
  fetchStudentLearningActivityGroup,
  postSubmitActivity,
  postSubmitLearningActivity,
} from "../../stores/course-action";
import type {
  ClassworkDetailFull,
  GetStudentActivityGroupParams,
  GetStudentActivityGroupResp,
  GetStudentLearningActivityGroupParams,
} from "../../types/course-type";
import {
  checkIsOverSubmittionDeadline,
  convertDateToThaiFormat,
} from "../../../../../utils/format-thai-date";
import { mapFileDetailToUploadFile } from "../../../../../types/map-file";
import SubmitClassworkForm from "./submit-classwork-form";
import CreateGroupworkSection from "./create-groupwork-section";
import ShowGroupworkModal from "./show-groupwork-modal";
import { appendAttachments } from "../../../../../utils/append-form-data";

type Props = {
  // classworkDetail: ClassworkDetailFull;
  handleFetchData: () => Promise<void>;
};

const SubmitClassworkSection = (props: Props) => {
  const [messageApi, contextHolder] = message.useMessage();

  const dispatch = useDispatch<AppDispatch>();
  const courseSlice = useSelector((state: RootState) => state.studentCourse);

  const [previewAllFiles, setPreviewAllFiles] = useState<
    AttachmentDetailItem[]
  >([]);
  const [resubmitted, setResubmitted] = useState<boolean>(false);
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);
  const [studentGroupWork, setStudentGroupWork] =
    useState<GetStudentActivityGroupResp | null>(null);
  const [isFileEmpty, setIsFileEmpty] = useState<boolean>(false);

  const classworkDetail = useMemo(() => {
    return courseSlice.classworkDetail;
  }, [courseSlice.classworkDetail]);

  const handleOnSubmit = async () => {
    if (previewAllFiles.length > 0 && classworkDetail) {
      setIsFileEmpty(false);
      if (classworkDetail.category === "activity") {
        await handleOnSubmitActivity();
      } else {
        await handleOnSubmitLearningActivity();
      }
    } else {
      setIsFileEmpty(true);
    }
  };

  const handleOnResubmitted = () => {
    setResubmitted(true);
  };

  const handleOnSubmitActivity = async () => {
    try {
      if (!classworkDetail) return;

      const formData = new FormData();
      const existingFileIds: number[] = [];

      formData.append(
        "student_activity_id",
        JSON.stringify(classworkDetail.id),
      );
      formData.append("student_id", classworkDetail.student_id);
      formData.append("section_id", JSON.stringify(classworkDetail.section_id));
      formData.append(
        "activity_id",
        JSON.stringify(classworkDetail.activity_id),
      );
      formData.append("type", classworkDetail.type);

      if (classworkDetail.type === "GROUP" && studentGroupWork) {
        formData.append("group_id", JSON.stringify(studentGroupWork.group_id));
      }

      const links: { title: string; url: string }[] = [];

      previewAllFiles.forEach((a) => {
        if (
          a.attachmentType === AttachmentType.FILE ||
          a.attachmentType === AttachmentType.IMAGE
        ) {
          const fileItem = a.attachmentItems;

          if (fileItem.originFileObj) {
            formData.append("files", fileItem.originFileObj as File);
          } else {
            if (fileItem.uid) {
              existingFileIds.push(parseInt(fileItem.uid));
            }
          }
        }

        if (a.attachmentType === AttachmentType.LINK) {
          if (a.attachmentItems.id) {
            existingFileIds.push(a.attachmentItems.id);
          } else {
            links.push({
              title: a.attachmentItems.title,
              url: a.attachmentItems.url,
            });
          }
        }
      });

      if (links.length > 0) {
        formData.append("urls", JSON.stringify(links));
      }

      if (existingFileIds.length > 0) {
        formData.append("existing_files_ids", JSON.stringify(existingFileIds));
      }

      for (const [key, value] of formData) {
        console.log(`${key}: ${value}`);
      }

      const resp = await dispatch(postSubmitActivity(formData)).unwrap();

      if (resp.success) {
        messageApi.success("ส่งงานสำเร็จ");
        setResubmitted(false);
        // await props.handleFetchData();
      }
    } catch (error) {}
  };

  const handleOnSubmitLearningActivity = async () => {
    try {
      if (!classworkDetail) return;

      const formData = new FormData();
      const existingFileIds: number[] = [];

      formData.append(
        "student_learning_activity_id",
        JSON.stringify(classworkDetail.id),
      );
      formData.append("student_id", classworkDetail.student_id);
      formData.append("section_id", JSON.stringify(classworkDetail.section_id));
      formData.append(
        "learning_activity_id",
        JSON.stringify(classworkDetail.activity_id),
      );
      formData.append("type", classworkDetail.type);

      if (classworkDetail.type === "GROUP" && studentGroupWork) {
        formData.append("group_id", JSON.stringify(studentGroupWork.group_id));
      }

      const links: { title: string; url: string }[] = [];

      previewAllFiles.forEach((a) => {
        if (
          a.attachmentType === AttachmentType.FILE ||
          a.attachmentType === AttachmentType.IMAGE
        ) {
          const fileItem = a.attachmentItems;

          if (fileItem.originFileObj) {
            formData.append("files", fileItem.originFileObj as File);
          } else {
            if (fileItem.uid) {
              existingFileIds.push(parseInt(fileItem.uid));
            }
          }
        }

        if (a.attachmentType === AttachmentType.LINK) {
          if (a.attachmentItems.id) {
            existingFileIds.push(a.attachmentItems.id);
          } else {
            links.push({
              title: a.attachmentItems.title,
              url: a.attachmentItems.url,
            });
          }
        }
      });

      if (links.length > 0) {
        formData.append("urls", JSON.stringify(links));
      }

      if (existingFileIds.length > 0) {
        formData.append("existing_files_ids", JSON.stringify(existingFileIds));
      }

      const resp = await dispatch(
        postSubmitLearningActivity(formData),
      ).unwrap();

      if (resp.success) {
        messageApi.success("ส่งงานสำเร็จ");
        setResubmitted(false);

        // await props.handleFetchData();
      }
    } catch (error) {
      console.error(error);
      messageApi.error("เกิดข้อผิดพลาดในการส่งงาน");
    }
  };

  const handleOnRemove = (item: AttachmentDetailItem) => {
    const newList = previewAllFiles.filter((prev) => prev !== item);

    setPreviewAllFiles(newList);
  };

  const handleFetchStudentGroup = async () => {
    if (classworkDetail) {
      if (classworkDetail.category === "activity") {
        await handleFetchStudentActivityGroup();
      } else {
        await handleFetchStudentLearningActivityGroup();
      }
    }
  };

  const handleFetchStudentActivityGroup = async () => {
    if (!classworkDetail) return;

    const params: GetStudentActivityGroupParams = {
      student_id: classworkDetail.student_id,
      activity_id: classworkDetail.activity_id,
    };

    const resp = await dispatch(fetchStudentActivityGroup(params)).unwrap();

    setStudentGroupWork(resp.data);
  };

  const handleFetchStudentLearningActivityGroup = async () => {
    if (!classworkDetail) return;

    const params: GetStudentLearningActivityGroupParams = {
      student_id: classworkDetail.student_id,
      learning_activity_id: classworkDetail.activity_id,
    };

    const resp = await dispatch(
      fetchStudentLearningActivityGroup(params),
    ).unwrap();

    setStudentGroupWork(resp.data);
  };

  useEffect(() => {
    if (!classworkDetail) {
      setPreviewAllFiles([]);
      return;
    }

    const previewFiles = classworkDetail.submitted_files.file.map((file) => ({
      attachmentType: AttachmentType.FILE,
      attachmentItems: mapFileDetailToUploadFile(file),
    }));

    const previewLinks = classworkDetail.submitted_files.url.map((url) => ({
      attachmentType: AttachmentType.LINK,
      attachmentItems: {
        id: url.attachment_id,
        title: url.title,
        url: url.url,
      },
    }));

    setPreviewAllFiles([...previewFiles, ...previewLinks]);
  }, [classworkDetail]);

  // fetch group in case of groupwork
  useEffect(() => {
    if (classworkDetail && classworkDetail.type === "GROUP") {
      handleFetchStudentGroup();
    }
  }, [classworkDetail]);

  return (
    <>
      {classworkDetail && (
        <div className="bg-white 2xl:px-9 2xl:py-8 p-6 rounded-2xl flex flex-col gap-4 h-fit">
          {contextHolder}

          <div>
            <div className="flex justify-between items-center">
              <div className="body-medium-3">งานของฉัน</div>

              {studentGroupWork && (
                <>
                  <a
                    className="text-secondary-blue cursor-pointer underline caption-regular"
                    onClick={() => setShowGroupModal(true)}
                  >
                    กลุ่มของฉัน
                  </a>

                  <ShowGroupworkModal
                    openModal={showGroupModal}
                    setOpenModal={setShowGroupModal}
                    handleFetchStudentGroup={handleFetchStudentGroup}
                    studentGroupWork={studentGroupWork}
                    // editable={classworkDetail.status !== "GRADED"}
                    classworkDetail={classworkDetail}
                  />
                </>
              )}
            </div>

            {classworkDetail.status !== "NOT_SUBMITTED" && (
              <div className="flex 2xl:flex-row flex-col 2xl:gap-2 mt-2 2xl:mt-0 text-primary-grey">
                <div className="caption-bold">ส่งแล้ว</div>
                <div className="caption-regular">
                  {convertDateToThaiFormat(classworkDetail.submitted_at)}
                </div>
              </div>
            )}
          </div>

          {previewAllFiles.length > 0 && (
            <PreviewFiles
              attachmentItems={previewAllFiles}
              handleOnRemove={handleOnRemove}
              action={classworkDetail.status === "NOT_SUBMITTED" || resubmitted}
            />
          )}

          {classworkDetail.status === "NOT_SUBMITTED" || resubmitted ? (
            classworkDetail.type === "GROUP" && studentGroupWork === null ? (
              <CreateGroupworkSection
                handleFetchData={props.handleFetchData}
                classworkDetail={classworkDetail}
              />
            ) : (
              <SubmitClassworkForm
                setPreviewAllFiles={setPreviewAllFiles}
                handleOnSubmit={handleOnSubmit}
                messageApi={messageApi}
                isFileEmpty={isFileEmpty}
              />
            )
          ) : (
            <>
              <Popconfirm
                title="ส่งงานอีกครั้ง"
                description="คุณต้องการส่งงานอีกครั้งหรือไม่?"
                okText="ยืนยัน"
                cancelText="ยกเลิก"
                onConfirm={handleOnResubmitted}
              >
                <Button
                  className="rounded-xl"
                  disable={
                    classworkDetail.status === "GRADED" ||
                    checkIsOverSubmittionDeadline(classworkDetail.deadline_date)
                  }
                >
                  ส่งอีกครั้ง
                </Button>
              </Popconfirm>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default SubmitClassworkSection;
