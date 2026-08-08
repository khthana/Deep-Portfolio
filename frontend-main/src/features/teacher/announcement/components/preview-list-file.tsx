import {
  DeleteOutlined,
  FilePdfOutlined,
  PaperClipOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { Popconfirm } from "antd";
import {
  AttachmentType,
  type AttachmentDetailItem,
} from "../types/announement-type";

type Props = {
  attachmentItems: AttachmentDetailItem[];
  handleOnRemove: (item: AttachmentDetailItem) => void;
  isFullWidth?: boolean;
};

const PreviewListFile = (props: Props) => {
  return (
    <div>
      {props.attachmentItems.map((attachment) =>
        attachment.attachmentType === AttachmentType.LINK ? (
          <div
            key={attachment.attachmentItems.url}
            className={`flex items-center justify-between duration-300 ease-in-out rounded-md hover:bg-light-grey ${props.isFullWidth ? "w-full" : "w-2/5"}`}
          >
            <div className="w-full flex gap-2 truncate">
              <PaperClipOutlined />

              <div className="w-full text-start truncate">
                {attachment.attachmentItems.title}
              </div>
            </div>
            <span className="ant-upload-list-item-card-actions">
              <Popconfirm
                title="Confirm Deletion"
                description={`Are you sure you want to remove ${attachment.attachmentItems.title}?`}
                okText="Yes"
                cancelText="No"
                onConfirm={() => props.handleOnRemove(attachment)}
              >
                <DeleteOutlined className="duration-300 ease-in-out hover:!text-red-500" />
              </Popconfirm>
            </span>
          </div>
        ) : (
          <div
            key={attachment.attachmentItems.uid}
            className={`flex items-center justify-between ${props.isFullWidth ? "w-full" : "w-2/5"}`}
          >
            <div className="flex gap-2 truncate">
              {attachment.attachmentType === AttachmentType.FILE ? (
                <FilePdfOutlined />
              ) : (
                <PictureOutlined />
              )}
              <div className="truncate">{attachment.attachmentItems.name}</div>
            </div>

            <div className="flex gap-2">
              <div className="text-primary-grey 2xl:text-sm lg:text-xs text-nowrap">
                {attachment.attachmentItems.size &&
                  `${(attachment.attachmentItems.size / 1024).toFixed(2)} KB`}
              </div>
              <Popconfirm
                title="Confirm Deletion"
                description={`Are you sure you want to remove ${attachment.attachmentItems.name}?`}
                okText="Yes"
                cancelText="No"
                onConfirm={() => props.handleOnRemove(attachment)}
              >
                <DeleteOutlined className="duration-300 ease-in-out hover:!text-red-500" />
              </Popconfirm>
            </div>
          </div>
        ),
      )}
    </div>
  );
};

export default PreviewListFile;
