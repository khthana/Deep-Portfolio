import { Link } from "react-router-dom";
import { paths } from "../../routes/paths.config";
import StudentInfoDropdown from "./student-info-dropdown";

const StudentNavbar = () => {
  return (
    <div className="text-white bg-primary-orange 2xl:h-16 h-10 shadow-[0_4px_06px_-4px_rgba(0,0,0,0.2)] flex justify-between 2xl:px-13 2xl:py-5 px-7 py-3 body-bold-3 z-50">
      <Link
        to={paths.student.root}
        className="flex items-center 2xl:gap-6 gap-3"
      >
        <img
          src="/assets/navbar/deep-logo.svg"
          className="2xl:w-8 w-6"
          alt="deep logo"
        />
        <div>DEEP-PORTFOLIO</div>
      </Link>

      <div className="flex items-center gap-9">
        {/* <img
          src="/assets/navbar/noti-icon.svg"
          className="w-8"
          alt="noti-icon"
        /> */}
        <div className="flex items-center gap-5">
          {/* <div>นันท์นิชา ปัถวี</div> */}
          {/* <div className="rounded-full">
            <img
              src="/assets/user/avatar.png"
              className="w-8 rounded-full"
              alt="user-image"
            />
          </div> */}

          <StudentInfoDropdown />
        </div>
      </div>
    </div>
  );
};

export default StudentNavbar;
