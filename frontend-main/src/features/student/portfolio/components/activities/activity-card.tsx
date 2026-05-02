import { Image, Popconfirm } from "antd";
import WhiteContainer from "../../../../../components/container/white-container";
import type { PortfolioActivityType as PortfolioActivityResp } from "../../types/activity-type.type";
import { getFile } from "../../../../../utils/get-file";
import { convertToBE } from "../../../../../utils/year-utils";

type Props = {
  data: PortfolioActivityResp;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
};

const isImageFile = (filename: string | null) => {
  if (!filename) return false;
  const ext = filename.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");
};

const ActivityCard = (props: Props) => {
  return (
    <WhiteContainer>
      <div className="flex gap-16 w-full items-start">
        <div className="body-bold-1 text-primary-orange text-nowrap">
          {props.data.date
            ? convertToBE(new Date(props.data.date).getFullYear())
            : "-"}
        </div>

        <div className="flex flex-col gap-4 w-full">
          <div className="w-full flex justify-between pb-2 border-b border-light-grey">
            <div className="body-bold-3">{props.data.name || "ไม่ระบุ"}</div>
            <div className="flex gap-2">
              <img
                src="/assets/course/edit-icon.svg"
                alt="edit icon"
                width={24}
                height={24}
                className="cursor-pointer"
                onClick={() => props.onEdit?.(props.data.id)}
              />
              <Popconfirm
                title="ลบรายการ"
                description="คุณต้องการลบรายการนี้ใช่หรือไม่?"
                onConfirm={() => props.onDelete?.(props.data.id)}
                okText="ใช่"
                cancelText="ไม่"
              >
                <img
                  src="/assets/course/delete-icon.svg"
                  alt="delete icon"
                  width={24}
                  height={24}
                  className="cursor-pointer"
                />
              </Popconfirm>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4">
            <div className="flex-1">
              {props.data.role && (
                <div className="text-primary-grey">{props.data.role}</div>
              )}
              {props.data.description && (
                <div className="text-sm text-gray-600 mt-2">
                  {props.data.description}
                </div>
              )}
            </div>

            {/* Photo Previews */}
            {props.data.attachments && props.data.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 py-1">
                {props.data.attachments
                  .filter((a) => isImageFile(a.original_filename))
                  .map((attachment) => (
                    <Image
                      key={attachment.attachment_id}
                      src={
                        attachment.url?.startsWith("http")
                          ? attachment.url
                          : getFile(
                              attachment.url || attachment.file_path || "",
                            )
                      }
                      alt={attachment.original_filename || ""}
                      width={80}
                      height={80}
                      className="object-cover rounded-lg shadow-sm border border-gray-100"
                    />
                  ))}
              </div>
            )}
          </div>

          {props.data.attachments && props.data.attachments.length > 0 && (
            <div className="text-primary-grey flex flex-wrap gap-x-4 gap-y-1">
              {props.data.attachments.map((attachment) => (
                <div
                  key={attachment.attachment_id}
                  className="text-xs text-blue-600 flex items-center gap-1"
                >
                  <span>📎</span>
                  <span>{attachment.original_filename}</span>
                </div>
              ))}
            </div>
          )}

          {!props.data.is_show && (
            <div className="text-red-500 text-sm">ไม่แสดงบนหน้าเว็บผลงาน</div>
          )}
        </div>
      </div>
    </WhiteContainer>
  );
};

export default ActivityCard;
