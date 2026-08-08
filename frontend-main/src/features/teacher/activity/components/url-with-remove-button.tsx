import { DeleteOutlined, PaperClipOutlined } from "@ant-design/icons";
import type {
  FileDetail,
  URLDetail,
} from "../../../../types/attachment-type.type";
import type { AppDispatch } from "../../../../stores/stores";
import { useDispatch } from "react-redux";
import { message, Popconfirm } from "antd";
import type { MessageInstance } from "antd/es/message/interface";

type Props = {
  urlDetail: URLDetail;
  setRemoveFile?: React.Dispatch<React.SetStateAction<number[]>>;

  setOldUrls?: React.Dispatch<React.SetStateAction<URLDetail[]>>;
};

const UrlWithRemoveButton = (props: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  // const [messageApi, contextHolder] = message.useMessage();

  const handleOnRemove = async () => {
    try {
      if (!props.setRemoveFile || !props.setOldUrls) return;
      props.setOldUrls((prev) => prev.filter((url) => url !== props.urlDetail));
      props.setRemoveFile((prev) => [...prev, props.urlDetail.attachment_id]);
    } catch (error) {}
  };

  return (
    <div className="w-2/5 flex justify-between">
      <div className="flex items-center gap-2">
        <PaperClipOutlined />
        <a
          href={props.urlDetail.url}
          target="_blank"
          rel="noreferrer"
          className="!underline"
        >
          {props.urlDetail.title}
        </a>
      </div>

      <Popconfirm
        title="คุณต้องการลบไฟล์นี้หรือไม่?"
        onConfirm={handleOnRemove}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
      >
        <DeleteOutlined
          width={16}
          className="cursor-pointer hover:!text-primary-red"
        />
      </Popconfirm>
    </div>
  );
};

export default UrlWithRemoveButton;
