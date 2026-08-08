import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Input } from "antd";
import { useState, type Dispatch, type SetStateAction } from "react";

type Props = {
  handleOnUpload: (title: string, url: string) => void;
  setShowUploadLinkForm: Dispatch<SetStateAction<boolean>>;
};

const MaterialUploadLinkForm = (props: Props) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});

  const handleAdd = () => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = "กรุณากรอกชื่อลิงค์";
    }
    if (!url.trim()) {
      newErrors.url = "กรุณากรอก URL";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      props.handleOnUpload(title, url);

      setTitle("");
      setUrl("");
    }
  };

  return (
    <div className="grid grid-cols-5 text-start gap-1 mt-2">
      <div className="col-span-2">ชื่อลิงก์</div>
      <div className="col-span-2">URL</div>
      <div></div>

      <div className="col-span-2">
        <Input
          size="small"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          status={errors.title ? "error" : ""}
        />
      </div>
      <div className="col-span-2">
        <Input
          size="small"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          status={errors.url ? "error" : ""}
        />
      </div>

      <div className="pb-2 flex gap-2 items-center justify-center">
        <CheckOutlined onClick={handleAdd} />
        <CloseOutlined onClick={() => props.setShowUploadLinkForm(false)} />
      </div>
      <div className="col-span-2">
        {errors.title && (
          <span className="text-red-500 mt-1">{errors.title}</span>
        )}
      </div>
      <div className="col-span-2">
        {errors.url && <span className="text-red-500 mt-1">{errors.url}</span>}
      </div>
    </div>
    // <div className="flex gap-4 items-end w-full my-2">
    //   <div className="flex gap-4 w-4/5">
    //     <div className="flex flex-col w-1/2">
    //       <div className="mb-1 text-start">ชื่อลิงก์</div>
    //       <Input
    //         size="small"
    //         value={title}
    //         onChange={(e) => setTitle(e.target.value)}
    //         status={errors.title ? "error" : ""}
    //       />
    //       {errors.title && (
    //         <span className="text-red-500 mt-1">{errors.title}</span>
    //       )}
    //     </div>

    //     <div className="flex flex-col w-1/2">
    //       <div className="mb-1 text-start">URL</div>
    //       <Input
    //         size="small"
    //         value={url}
    //         onChange={(e) => setUrl(e.target.value)}
    //         status={errors.url ? "error" : ""}
    //       />
    //       {errors.url && (
    //         <span className="text-red-500 mt-1">{errors.url}</span>
    //       )}
    //     </div>
    //   </div>

    //   <div className="pb-2 flex gap-2 items-center justify-center">
    //     <CheckOutlined onClick={handleAdd} />
    //     <CloseOutlined onClick={() => {}} />
    //   </div>
    // </div>
  );
};

export default MaterialUploadLinkForm;
