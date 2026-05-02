import { useEffect, useState } from "react";
import { Popconfirm, message, Tag, Image } from "antd";
import { getFile } from "../../../../../utils/get-file";
import WhiteContainer from "../../../../../components/container/white-container";
import type { PortfolioWorkResp } from "../../../../../types/portfolio-skill-type.type";
import { deleteSkillMapping } from "../../../../../services/portfolio-skill.service";
import {
  getActivityDetails,
  getStudentActivityAttachments,
} from "../../../../../services/student.service";
import WorkEditModal from "./work-edit-modal";

const isImage = (filename: string | null) => {
  if (!filename) return false;
  const ext = filename.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");
};

type Props = {
  work: PortfolioWorkResp;
  onSuccess: () => void;
};

const WorkCard = ({ work, onSuccess }: Props) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activityName, setActivityName] = useState<string | null>(null);
  const [subjectInfo, setSubjectInfo] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const details = await getActivityDetails(work.student_activity_id);
        const actName = details.data?.activities?.activity_name;
        const subId = details.data?.course?.course_id;
        const subName = details.data?.course?.course_name_en;

        setActivityName(actName || null);
        if (subId && subName) {
          setSubjectInfo(`${subId} - ${subName}`);
        }

        const attachRes = await getStudentActivityAttachments(
          work.student_activity_id,
        );
        if (attachRes.success) {
          setAttachments(attachRes.data || []);
        }
      } catch {
        /* silent */
      }
    };
    fetchDetails();
  }, [work.student_activity_id]);

  // Delete all mapping rows → removes work card entirely
  const handleDeleteWork = async () => {
    try {
      await Promise.all(work.mapping_ids.map((id) => deleteSkillMapping(id)));
      message.success("ลบข้อมูลสำเร็จ");
      onSuccess();
    } catch {
      message.error("เกิดข้อผิดพลาดในการลบผลงาน");
    }
  };

  return (
    <>
      <WhiteContainer>
        {/* Header — matches SkillCard header exactly */}
        <div className="flex justify-between items-center pb-4 border-b border-light-grey">
          <div className="flex flex-col">
            <div className="body-bold-1 text-primary-orange">
              {activityName || "ชิ้นงาน"}
            </div>
            {subjectInfo && (
              <div className="caption-regular text-primary-grey mt-0.5">
                {subjectInfo}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <img
              src="/assets/course/edit-icon.svg"
              alt="edit work"
              className="cursor-pointer"
              width={24}
              height={24}
              onClick={() => setIsEditOpen(true)}
            />

            <Popconfirm
              title="คุณต้องการลบรายการนี้ใช่หรือไม่?"
              okText="ใช่"
              cancelText="ไม่"
              onConfirm={handleDeleteWork}
            >
              <img
                src="/assets/course/delete-icon.svg"
                alt="delete work"
                className="cursor-pointer   "
                width={24}
                height={24}
              />
            </Popconfirm>
          </div>
        </div>

        {/* Skill tags — matches SkillCard "ผลงานที่เกี่ยวข้อง" block */}
        <div className="flex flex-col gap-1">
          {work.skills.length === 0 ? (
            <div className="text-gray-400 text-sm pl-5">
              ยังไม่มีทักษะ กด &ldquo;แก้ไข&rdquo; เพื่อเพิ่มทักษะ
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {work.skills.map((skill) => (
                <div
                  key={skill.id}
                  className="px-2 py-2 inline-block rounded-lg caption-regular bg-[#00000006]"
                >
                  {skill.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 text-primary-grey flex flex-wrap gap-x-4 gap-y-1">
          {attachments.length > 0 &&
            attachments.map((attachment, idx) => (
              <div
                key={idx}
                className="text-xs text-blue-600 flex items-center gap-1"
              >
                <span>📎</span>
                <span>{attachment.original_filename}</span>
              </div>
            ))}
        </div>

        {/* Photo Previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 py-1 mt-4">
            {attachments
              .filter((a) => isImage(a.original_filename))
              .map((attachment, idx) => (
                <Image
                  key={idx}
                  src={
                    attachment.url?.startsWith("http")
                      ? attachment.url
                      : getFile(attachment.url || "")
                  }
                  alt={attachment.original_filename || ""}
                  width={80}
                  height={80}
                  className="object-cover rounded-lg shadow-sm border border-gray-100"
                />
              ))}
          </div>
        )}
      </WhiteContainer>

      <WorkEditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => {
          setIsEditOpen(false);
          onSuccess();
        }}
        work={work}
        activityName={activityName || "ชิ้นงาน"}
        subjectInfo={subjectInfo || ""}
      />
    </>
  );
};

export default WorkCard;
