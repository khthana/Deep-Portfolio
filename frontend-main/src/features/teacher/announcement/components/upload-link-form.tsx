import { Input } from "antd";
import { useState } from "react";

type Props = {
  handleOnUpload: (title: string, url: string) => void;
};

const UploadLinkForm = (props: Props) => {
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
    <div className="flex gap-4 items-start w-full mb-4">
      <div className="flex gap-4 2xl:w-1/2 w-2/3">
        <div className="flex flex-col w-1/2">
          <div className="mb-1">ชื่อลิงก์</div>
          <Input
            size="large"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            status={errors.title ? "error" : ""}
          />
          {errors.title && (
            <span className="text-red-500 mt-1">{errors.title}</span>
          )}
        </div>

        <div className="flex flex-col w-1/2">
          <div className="mb-1">URL</div>
          <Input
            size="large"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            status={errors.url ? "error" : ""}
          />
          {errors.url && (
            <span className="text-red-500 mt-1">{errors.url}</span>
          )}
        </div>
      </div>

      <button
        className="border-2 rounded-2xl p-1 border-secondary-blue mt-7 cursor-pointer"
        type="button"
        onClick={handleAdd}
      >
        <img src="/assets/course/add-icon.svg" width={24} />
      </button>
    </div>
  );
};

export default UploadLinkForm;
