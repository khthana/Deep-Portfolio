import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  matchPath,
  generatePath,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../stores/stores";
import { paths } from "../../routes/paths.config";
import { teacherHomeSliceAction } from "../../features/teacher/home/stores/teacher-home-slice";
import { useEffect, useState } from "react";
import { fetchCourseById } from "../../features/teacher/home/stores/teacher-home-action";

const menuItems = [
  {
    key: "ANNOUNCEMENT",
    icon: {
      inActive: (
        <img
          src="/assets/sidebar/announcement-inactive-icon.svg"
          className="w-[18px]"
          alt="announcement icon"
        />
      ),
      active: (
        <img
          src="/assets/sidebar/announcement-blue-icon.svg"
          className="w-[18px]"
          alt="announcement icon"
        />
      ),
    },
    label: "ประกาศ",
    url: paths.teacher.course.announcement.list,
    matchPaths: [
      paths.teacher.course.announcement.list,
      paths.teacher.course.announcement.new,
    ],
  },
  {
    key: "COURSE",
    icon: {
      inActive: (
        <img
          src="/assets/sidebar/book-icon.svg"
          className="w-[18px]"
          alt="book icon"
        />
      ),
      active: (
        <img
          src="/assets/sidebar/book-blue-icon.svg"
          className="w-[18px]"
          alt="book active icon"
        />
      ),
    },
    label: "รายละเอียดรายวิชา",
    url: paths.teacher.course.detail,
    matchPaths: [paths.teacher.course.detail],
  },

  {
    key: "INSTRUCTION",
    icon: {
      inActive: (
        <img
          src="/assets/sidebar/calendar-icon.svg"
          className="w-[18px]"
          alt="calendar icon"
        />
      ),
      active: (
        <img
          src="/assets/sidebar/calendar-blue-icon.svg"
          className="w-[18px]"
          alt="calendar active icon"
        />
      ),
    },
    label: "การจัดการสอน",
    url: paths.teacher.course.plan,
    matchPaths: [
      paths.teacher.course.plan,
      paths.teacher.course.material,
      paths.teacher.course.mapping,
    ],
    subMenuItems: [
      {
        key: "PLAN",
        label: "แผนการสอน",
        url: paths.teacher.course.plan,
        matchPaths: [paths.teacher.course.plan],
      },
      {
        key: "MATERIAL",
        label: "สื่อการสอน",
        url: paths.teacher.course.material,
        matchPaths: [paths.teacher.course.material],
      },
      {
        key: "MAPPING",
        label: "วางแผนรายวิชา",
        url: paths.teacher.course.mapping,
        matchPaths: [paths.teacher.course.mapping],
      },
    ],
  },
  {
    key: "CLASSWORK",
    icon: {
      inActive: (
        <img
          src="/assets/sidebar/classwork-inactive-icon.svg"
          className="w-[18px]"
          alt="classwork icon"
        />
      ),
      active: (
        <img
          src="/assets/sidebar/classwork-blue-icon.svg"
          className="w-[18px]"
          alt="classwork active icon"
        />
      ),
    },
    label: "การประเมินผล",
    url: paths.teacher.course.activity.list,
    matchPaths: [
      paths.teacher.course.activity.list,
      paths.teacher.course.learningActivity.list,
      paths.teacher.course.gradebook,
    ],
    subMenuItems: [
      {
        key: "CLASSWORK",
        label: "กิจกรรมการประเมิน",
        url: paths.teacher.course.activity.list,
        matchPaths: [paths.teacher.course.activity.list],
      },
      {
        key: "ACTIVITY",
        label: "กิจกรรมการเรียนรู้",
        url: paths.teacher.course.learningActivity.list,
        matchPaths: [paths.teacher.course.learningActivity.list],
      },
      {
        key: "GRADEBOOK",
        label: "สมุดคะแนน",
        url: paths.teacher.course.gradebook,
        matchPaths: [paths.teacher.course.gradebook],
      },
    ],
  },
  {
    key: "STUDENT",
    icon: {
      inActive: (
        <img
          src="/assets/sidebar/student-inactive-icon.svg"
          className="w-[18px]"
          alt="student icon"
        />
      ),
      active: (
        <img
          src="/assets/sidebar/student-active-icon.svg"
          className="w-[18px]"
          alt="student active icon"
        />
      ),
    },
    label: "นักศึกษา",
    url: paths.teacher.course.student,
    matchPaths: [paths.teacher.course.student],
  },
];

const TeacherSideBar = () => {
  const { secId } = useParams<{ secId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const dispatch = useDispatch<AppDispatch>();
  const teacherHomeSlice = useSelector((state: RootState) => state.teacherHome);

  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

  const handleFetchCourse = async () => {
    if (!secId) return;
    await dispatch(fetchCourseById(parseInt(secId)));
  };

  const handleMenuOnClick = (menu: (typeof menuItems)[number]) => {
    if (menu.subMenuItems && menu.subMenuItems.length > 0) {
      const firstSubMenu = menu.subMenuItems[0];

      const path = generatePath(firstSubMenu.url, { secId: secId });
      navigate(path);
    } else {
      const path = generatePath(menu.url, { secId: secId });
      navigate(path);
    }
  };

  const handleSubMenuOnClick = (url: string) => {
    const path = generatePath(url, { secId });
    navigate(path);
  };

  const handleBackOnClick = () => {
    navigate(paths.teacher.root);
  };

  const getActiveMenuKey = (path: string): string | null => {
    for (const menu of menuItems) {
      if (menu.matchPaths) {
        for (const mp of menu.matchPaths) {
          if (matchPath({ path: mp, end: false }, path)) {
            return menu.key;
          }
        }
      }
    }
    return null;
  };

  const getActiveSubMenuKey = (path: string): string | null => {
    for (const menu of menuItems) {
      if (menu.subMenuItems) {
        for (const sub of menu.subMenuItems) {
          for (const mp of sub.matchPaths) {
            if (matchPath({ path: mp, end: false }, path)) {
              return sub.key;
            }
          }
        }
      }
    }
    return null;
  };

  const activeMenuKey = getActiveMenuKey(currentPath);
  const activeSubMenuKey = getActiveSubMenuKey(currentPath);

  useEffect(() => {
    handleFetchCourse();

    if (activeMenuKey) {
      setOpenMenuKey(activeMenuKey);

      dispatch(teacherHomeSliceAction.setActiveMenu(activeMenuKey));
    }
  }, [currentPath]);

  return (
    <div className="w-54 2xl:w-75 h-screen sticky top-0 bg-white body-bold-3 drop-shadow-xl">
      {teacherHomeSlice.selectedCourse && (
        <div className="flex flex-col w-full 2xl:gap-4 gap-2">
          {/* header course info */}
          <div
            className="2xl:px-12 2xl:py-6 px-6 py-3 bg-secondary-blue text-white flex flex-col gap-2"
            style={{ backgroundColor: "rgb(48, 104, 217, 0.9)" }}
          >
            <div
              onClick={handleBackOnClick}
              className="flex gap-2 cursor-pointer"
            >
              <img src="/assets/sidebar/back-icon.svg" alt="back icon" />
              <div className="caption-bold">กลับหน้าหลัก</div>
            </div>
            <div>
              <div className="body-bold-1">
                {teacherHomeSlice.selectedCourse.course_id}
              </div>
              <div className="caption-regular">
                {teacherHomeSlice.selectedCourse.course_name_en}
              </div>
            </div>
            <div className="bg-white 2xl:py-2 2xl:pl-4 py-1 pl-2  text-primary-black caption-regular rounded-xl">
              กลุ่มเรียน {teacherHomeSlice.selectedCourse.section_number}
            </div>
          </div>

          {menuItems.map((menu) => (
            <div key={menu.key}>
              <div
                className={`w-full flex items-center 2xl:gap-6 2xl:pl-13 2xl:pr-12 2xl:py-5  gap-3 pl-7 pr-6 py-3 cursor-pointer caption-bold ${
                  activeMenuKey === menu.key
                    ? "bg-secondary-blue/15 border-r-[5px] border-secondary-blue text-secondary-blue"
                    : "bg-white text-primary-black border-none"
                }`}
                onClick={() => handleMenuOnClick(menu)}
              >
                <div>
                  {activeMenuKey === menu.key
                    ? menu.icon.active
                    : menu.icon.inActive}
                </div>
                <div>{menu.label}</div>
              </div>

              {/* render submenu เฉพาะเมนูที่ถูกเปิด */}
              {menu.subMenuItems && openMenuKey === menu.key && (
                <div className="flex flex-col py-2">
                  {menu.subMenuItems.map((subMenu) => (
                    <div
                      key={subMenu.key}
                      className={`2xl:pl-25 2xl:py-5 pl-14 py-3 caption-regular cursor-pointer hover:text-secondary-blue ${
                        activeSubMenuKey === subMenu.key
                          ? "border-r-[5px] border-secondary-blue text-secondary-blue"
                          : "text-primary-black border-none"
                      }`}
                      onClick={() => handleSubMenuOnClick(subMenu.url)}
                    >
                      {subMenu.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherSideBar;
