import { useEffect } from "react";
import { useAuth } from "../../hooks/use-auth";
import TeacherInfoDropdown from "./teacher-info-dropdown";

const TeacherNavbar = () => {
  const { userData } = useAuth();

  return (
    <div className="text-white bg-secondary-blue 2xl:h-16 h-10 shadow-[0_4px_06px_-4px_rgba(0,0,0,0.2)] flex justify-between items-center 2xl:px-13 2xl:py-5 px-7 py-3 body-bold-3 z-30">
      <div className="flex items-center 2xl:gap-6 gap-3">
        <img
          src="/assets/navbar/deep-logo.svg"
          className="2xl:w-8 w-6"
          alt="deep logo"
        />
        <div>DEEP-QA</div>
      </div>

      <div className="flex items-center gap-2">
        <div className="caption-bold">{userData && userData.name}</div>
        <TeacherInfoDropdown />
      </div>
    </div>
  );
};

export default TeacherNavbar;
