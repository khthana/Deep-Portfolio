import { CloseOutlined } from "@ant-design/icons";
import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

type Props = {
  children?: React.ReactNode;
  openPopup: boolean;
  setIsOpenPopup: Dispatch<SetStateAction<boolean>>;
};

const DetailPopup = (props: Props) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({
    top: "100%",
    left: 0,
    visibility: "hidden",
  });

  const handleClickOutside = (event: MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
      props.setIsOpenPopup(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [props]);

  useLayoutEffect(() => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      const { innerWidth, innerHeight } = window;

      const newStyle: React.CSSProperties = {
        visibility: "visible",
      };

      // Check horizontal overflow
      if (rect.right > innerWidth) {
        newStyle.left = "auto";
        newStyle.right = 0;
      } else {
        newStyle.left = 0;
        newStyle.right = "auto";
      }

      // Check vertical overflow
      if (rect.bottom > innerHeight) {
        newStyle.top = "auto";
        newStyle.bottom = "100%";
      } else {
        newStyle.top = "100%";
        newStyle.bottom = "auto";
      }

      setPopupStyle(newStyle);
    }
  }, []);

  return (
    <div
      ref={popupRef}
      style={popupStyle}
      className="absolute w-102 bg-background px-8 py-9 rounded-2xl flex flex-col gap-6 z-50 shadow-lg"
    >
      <div className="absolute right-10 transform translate-full -translate-y-1/2 cursor-pointer">
        <CloseOutlined onClick={() => props.setIsOpenPopup(false)} />
      </div>

      {props.children}
    </div>
  );
};

export default DetailPopup;
