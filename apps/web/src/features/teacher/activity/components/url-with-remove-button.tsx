import { DeleteOutlined, PaperClipOutlined } from "@ant-design/icons";
import type { URLDetail } from "@deep-portfolio/api-types";
import { Popconfirm } from "antd";

type Props = {
  urlDetail: URLDetail;
  setRemoveFile?: React.Dispatch<React.SetStateAction<number[]>>;

  setOldUrls?: React.Dispatch<React.SetStateAction<URLDetail[]>>;
};

const UrlWithRemoveButton = (props: Props) => {
  const handleOnRemove = async () => {
    try {
      if (!props.setRemoveFile || !props.setOldUrls) return;
      props.setOldUrls((prev) => prev.filter((url) => url !== props.urlDetail));
      props.setRemoveFile((prev) => [...prev, props.urlDetail.attachment_id]);
    } catch (error) {
      console.error(error);
    }
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
