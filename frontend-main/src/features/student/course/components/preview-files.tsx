import { DeleteOutlined } from "@ant-design/icons";
import { Popconfirm, Grid } from "antd";
import {
  AttachmentType,
  type AttachmentDetailItem,
} from "../../../teacher/announcement/types/announement-type";
import { formatFileType } from "../../../../utils/format-file-type";

type Props = {
  attachmentItems: AttachmentDetailItem[];
  handleOnRemove: (item: AttachmentDetailItem) => void;
  action?: boolean;
};

const { useBreakpoint } = Grid;

const PreviewFiles = (props: Props) => {
  const screens = useBreakpoint();

  return (
    <div className="flex flex-col gap-2">
      {props.attachmentItems.map((attachment) =>
        attachment.attachmentType === AttachmentType.LINK ? (
          <div className="w-full flex justify-between items-center">
            <a
              href={attachment.attachmentItems.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${props.action ? "w-11/12" : "w-full"} 2xl:py-5 2xl:pl-5 2xl:pr-5 py-2 px-2 pl-2 2xl:rounded-2xl rounded-xl border border-light-grey flex 2xl:gap-4 gap-2 cursor-pointer ease-in-out duration-100 hover:text-secondary-blue`}
            >
              {screens.xxl && (
                <div className="bg-secondary-blue 2xl:p-[10px] p-2 rounded-sm caption-bold text-white">
                  LINK
                </div>
              )}

              <div className="overflow-hidden">
                <div className="caption-bold truncate">
                  {attachment.attachmentItems.title}
                </div>
                <div className="text-primary-grey text-sm truncate">
                  {attachment.attachmentItems.url}
                </div>
              </div>
            </a>

            {props.action && (
              <Popconfirm
                title="Confirm Deletion"
                description={`Are you sure you want to remove ${attachment.attachmentItems.title}?`}
                okText="Yes"
                cancelText="No"
                onConfirm={() => props.handleOnRemove(attachment)}
              >
                <DeleteOutlined className="duration-300 ease-in-out hover:!text-red-500" />
              </Popconfirm>
            )}
          </div>
        ) : (
          <div className="w-full flex justify-between items-center">
            <div
              className={`${props.action ? "w-11/12" : "w-full"}  2xl:py-5 2xl:pl-5 2xl:pr-5 py-2 px-2 pl-2 2xl:rounded-2xl rounded-xl border border-light-grey flex gap-4 cursor-pointer ease-in-out duration-100 hover:text-secondary-blue`}
            >
              {screens.xxl && attachment.attachmentItems.type && (
                <div className="bg-secondary-blue p-[10px] rounded-sm caption-bold text-white">
                  {formatFileType(attachment.attachmentItems.name)}
                </div>
              )}

              <div className="overflow-hidden">
                <div className="caption-bold truncate">
                  {attachment.attachmentItems.name}
                </div>
                {attachment.attachmentItems.size && (
                  <div className="text-primary-grey text-sm">
                    {`${(attachment.attachmentItems.size / 1024).toFixed(
                      2,
                    )} KB`}
                  </div>
                )}
              </div>
            </div>

            {props.action && (
              <Popconfirm
                title="Confirm Deletion"
                description={`Are you sure you want to remove ${attachment.attachmentItems.name}?`}
                okText="Yes"
                cancelText="No"
                onConfirm={() => props.handleOnRemove(attachment)}
              >
                <DeleteOutlined className="duration-300 ease-in-out hover:!text-red-500" />
              </Popconfirm>
            )}
          </div>
        ),
      )}
    </div>
  );
};

export default PreviewFiles;
