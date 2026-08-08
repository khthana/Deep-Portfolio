import { Image, Popconfirm } from "antd";
import WhiteContainer from "../../../../../components/container/white-container";
import type { PortfolioInternshipResp } from "../../../../../types/portfolio-internship-type.type";
import { getFile } from "../../../../../utils/get-file";

type Props = {
  data: PortfolioInternshipResp;
  onDelete?: (id: number) => void;
  onEdit?: (id: number) => void;
};

const ExperienceCard = ({ data, onDelete, onEdit }: Props) => {
  const startYear = data.start_date
    ? new Date(data.start_date).getFullYear() + 543 // Convert to Buddhist year if needed, or just display year
    : "-";

  const isImage = (filename: string | null) => {
    if (!filename) return false;
    const ext = filename.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");
  };

  return (
    <WhiteContainer>
      <div className="flex gap-16 w-full items-start">
        <div className="body-bold-1 text-primary-orange text-nowrap">
          {startYear}
        </div>

        <div className="flex flex-col gap-4 w-full">
          <div className="w-full flex justify-between pb-2 border-b border-light-grey">
            <div className="body-bold-3">
              {data.position || data.title || "-"}
            </div>
            <div className="flex gap-2">
              <img
                src="/assets/course/edit-icon.svg"
                alt="edit icon"
                width={24}
                height={24}
                className="cursor-pointer"
                onClick={() => onEdit?.(data.id)}
              />
              <Popconfirm
                title="ลบรายการ"
                description="คุณต้องการลบรายการนี้ใช่หรือไม่?"
                onConfirm={() => onDelete?.(data.id)}
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

          <div className="flex flex-col justify-between items-start gap-4">
            <div className="flex-1">
              <div>{data.company || "-"}</div>
              <div className="text-primary-grey">{data.province || "-"}</div>
            </div>

            {/* Photo Previews */}
            {data.attachments && data.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 py-1">
                {data.attachments
                  .filter((a) => isImage(a.original_filename))
                  .map((attachment) => (
                    <Image
                      key={attachment.attachment_id}
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
          </div>

          <div className="mt-2 text-primary-grey flex flex-wrap gap-x-4 gap-y-1">
            {data.attachments &&
              data.attachments.length > 0 &&
              data.attachments.map((attachment) => (
                <div
                  key={attachment.attachment_id}
                  className="text-xs text-blue-600 flex items-center gap-1"
                >
                  <span>📎</span>
                  <span>{attachment.original_filename}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </WhiteContainer>
  );
};

export default ExperienceCard;
