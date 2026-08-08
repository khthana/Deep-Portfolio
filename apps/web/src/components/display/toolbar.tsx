// export default Toolbar;
import {
  MinusOutlined,
  PlusOutlined,
  CloudDownloadOutlined,
} from "@ant-design/icons";
import { InputNumber } from "antd";
import { useEffect, useState } from "react";
import { getFile } from "../../utils/get-file";

type Props = {
  handleAddBookmark?: () => void;
  bookmark: boolean;
  // fullscreen: boolean;
  totalPage: number | null;
  currentPage: number;

  // handleEnterFullscreen: () => void;
  // handleExitFullscreen: () => void;
  handleGoToPage: (pageNumber: number) => void;

  onZoomIn: () => void;
  onZoomOut: () => void;

  fileSrc?: string;
};

const Toolbar = (props: Props) => {
  const [inputValue, setInputValue] = useState<number | null>(1);

  const handleDownload = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!props.fileSrc) return;

    try {
      const response = await fetch(getFile(props.fileSrc));
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;

      const fileName = props.fileSrc.split("/").pop() || "downloaded-file";

      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("ไม่สามารถดาวน์โหลดไฟล์ได้:", error);
      window.open(getFile(props.fileSrc), "_blank");
    }
  };

  useEffect(() => {
    setInputValue(props.currentPage);
  }, [props.currentPage]);

  return (
    <div className="grid grid-cols-3 items-center p-2 w-full bg-[#434A62] relative z-40 right-0 top-0">
      <div>
        {props.handleAddBookmark && (
          <div
            className="bg-white rounded-full p-1 w-fit cursor-pointer"
            onClick={props.handleAddBookmark}
          >
            {props.bookmark ? (
              <img
                src="/assets/classwork/favorite-black-icon.svg"
                alt="favorite"
                width={24}
                height={24}
              />
            ) : (
              <img
                src="/assets/classwork/favorite-icon.svg"
                alt="favorite"
                width={24}
                height={24}
              />
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 justify-center">
        <InputNumber
          className="!w-10 toolbar-custom-input"
          controls={false}
          max={props.totalPage ?? 1}
          min={1}
          value={inputValue}
          onChange={(value) => setInputValue(value)}
          onPressEnter={() => {
            if (inputValue) {
              props.handleGoToPage(inputValue);
            }
          }}
        />
        <div className="text-white">of {props.totalPage ?? 1}</div>
      </div>

      <div className="flex justify-end items-center gap-1">
        <div className="flex items-center gap-4 justify-center">
          <div className="bg-white rounded-4xl grid grid-cols-2 items-center justify-center w-20 py-1">
            <PlusOutlined
              className="border-r border-light-grey flex items-center justify-center"
              onClick={() => props.onZoomIn()}
            />
            <MinusOutlined
              className="items-center justify-center"
              onClick={() => props.onZoomOut()}
            />
          </div>
        </div>

        {props.fileSrc !== "-1" && (
          <a
            href={props.fileSrc}
            onClick={handleDownload}
            className="bg-white rounded-full p-1 w-fit cursor-pointer"
          >
            <CloudDownloadOutlined className="w-6 h-6 flex items-center justify-center" />
          </a>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
