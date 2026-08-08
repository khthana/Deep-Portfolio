import { DeleteOutlined } from "@ant-design/icons";
import type {
  FileDetail,
  URLDetail,
} from "../../../../types/attachment-type.type";
import type { AppDispatch } from "../../../../stores/stores";
import { useDispatch } from "react-redux";
import { removeCourseMaterial } from "../stores/teacher-material-action";
import { message, Popconfirm } from "antd";
import type { MessageInstance } from "antd/es/message/interface";

type Props = {
  urlDetail: URLDetail;
  handleFetchData: () => void;
  messageInstance: MessageInstance;
};

const UrlWithRemoveButton = (props: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  // const [messageApi, contextHolder] = message.useMessage();

  const handleOnRemove = async () => {
    try {
      await dispatch(
        removeCourseMaterial(props.urlDetail.attachment_id),
      ).unwrap();

      props.messageInstance.success("ลบไฟล์สำเร็จ");
      props.handleFetchData();
    } catch (error) {
      props.messageInstance.error("ลบไฟล์ไม่สำเร็จ");
    }
  };

  return (
    <div className="flex justify-between">
      <div className="!underline">{props.urlDetail.title}</div>

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
