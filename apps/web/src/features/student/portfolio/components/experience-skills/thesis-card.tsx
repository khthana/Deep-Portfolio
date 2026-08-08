import WhiteContainer from "../../../../../components/container/white-container";

import type { PortfolioThesisResp } from "../../types/portfolio-thesis-type.type";
import { Image, Popconfirm } from "antd";
import { getFile } from "../../../../../utils/get-file";

type Props = {
  data: PortfolioThesisResp;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
};

const isImage = (filename: string | null) => {
  if (!filename) return false;
  const ext = filename.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");
};

const ThesisCard = (props: Props) => {
  return (
    <WhiteContainer>
      <div className="w-full flex justify-between pb-2 border-b border-light-grey">
        <div className="body-bold-1 text-primary-orange">{props.data.name}</div>
        <div className="flex gap-2">
          <img
            src="/assets/course/edit-icon.svg"
            alt="edit icon"
            width={24}
            height={24}
            className="cursor-pointer"
            onClick={() => props.onEdit && props.onEdit(props.data.id)}
          />
          <Popconfirm
            title="ลบรายการ"
            description="คุณต้องการลบรายการนี้ใช่หรือไม่?"
            onConfirm={() => props.onDelete && props.onDelete(props.data.id)}
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

      <div className="flex flex-col gap-2">
        {/* <div className="body-bold-3">ไฟล์งาน</div> */}
        <div className="mt-2 text-primary-grey flex flex-wrap gap-x-4 gap-y-1">
          {props.data.attachments &&
            props.data.attachments.length > 0 &&
            props.data.attachments.map((attachment) => (
              <div
                key={attachment.attachment_id}
                className="text-xs text-blue-600 flex items-center gap-1"
              >
                <span>📎</span>
                <span>{attachment.original_filename}</span>
              </div>
            ))}
        </div>
        {/* Photo Previews */}
        {props.data.attachments && props.data.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 py-1">
            {props.data.attachments
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
    </WhiteContainer>
  );
};

export default ThesisCard;
