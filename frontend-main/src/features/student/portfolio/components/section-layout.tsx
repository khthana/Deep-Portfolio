import type React from "react";
import Button from "../../../../components/button/button";
import type { PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  title: string;
  onClick?: () => void;
  href?: string;
};

const SectionLayout: React.FC<PropsWithChildren<Props>> = ({
  title,
  onClick,
  href = "#",
  children,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    if (href && href !== "#") {
      navigate(href);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-9 border-b border-light-grey">
      <div className="flex justify-between">
        <div className="body-bold-1">{title}</div>
        <Button
          onClick={handleClick}
          iconSrc="/assets/portfolio/orange-add-icon.svg"
          variant="outline"
        >
          เพิ่มข้อมูล
        </Button>
      </div>

      {children}
    </div>
  );
};

export default SectionLayout;
