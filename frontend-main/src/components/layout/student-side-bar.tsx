import {
  generatePath,
  Link,
  matchPath,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../stores/stores";
import { homeSliceAction } from "../../features/student/home/stores/home-slice";
import { paths } from "../../routes/paths.config";
import { useEffect } from "react";
import { fetchCourseDetail } from "../../features/student/course/stores/course-action";
import { studentCourseSliceAction } from "../../features/student/course/stores/course-slice";
import {
  fetchPortfolioPersonal,
  fetchStudentDetail,
} from "../../features/student/home/stores/home-action";

const menuItems = [
  {
    key: "HOME",
    icon: {
      inActive: (
        <img
          src="/assets/sidebar/home-icon.svg"
          className="w-[18px]"
          alt="home icon"
        />
      ),
      active: (
        <img
          src="/assets/sidebar/home-active-icon.svg"
          className="w-[18px]"
          alt="home active icon"
        />
      ),
    },
    label: "หน้าหลัก",
    url: paths.student.root,
    matchPaths: [paths.student.root],
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
          src="/assets/sidebar/book-active-icon.svg"
          className="w-[18px]"
          alt="book active icon"
        />
      ),
    },
    label: "รายวิชา",
    url: paths.student.course.list,
    matchPaths: [
      paths.student.course.list,
      paths.student.course.announcement,
      paths.student.course.detail,
      paths.student.course.classwork.list,
      paths.student.course.classwork.detail,
      paths.student.course.evaluation.list,
    ],
    subMenuItems: [
      {
        key: "ANNOUNCEMENT",
        label: "ประกาศ",
        url: paths.student.course.announcement,
        matchPaths: [paths.student.course.announcement],
      },
      {
        key: "COURSE_DETAIL",
        label: "รายละเอียดรายวิชา",
        url: paths.student.course.detail,
        matchPaths: [paths.student.course.detail],
      },
      {
        key: "CLASSWORK",
        label: "งานในชั้นเรียน",
        url: paths.student.course.classwork.list,
        matchPaths: [
          paths.student.course.classwork.list,
          paths.student.course.classwork.detail,
        ],
      },
      {
        key: "EVALUATION_RESULT",
        label: "ผลการประเมิน",
        url: paths.student.course.evaluation.list,
        matchPaths: [paths.student.course.evaluation.list],
      },
    ],
  },

  {
    key: "CARENDAR",
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
          src="/assets/sidebar/calendar-active-icon.svg"
          className="w-[18px]"
          alt="calendar active icon"
        />
      ),
    },
    label: "ปฏิทินการเรียน",
    url: paths.student.calendar,
    matchPaths: [paths.student.calendar],
  },
  {
    key: "PORTFOLIO",
    icon: {
      inActive: (
        <img
          src="/assets/sidebar/portfolio-icon.svg"
          className="w-[18px]"
          alt="portfolio icon"
        />
      ),
      active: (
        <img
          src="/assets/sidebar/portfolio-active-icon.svg"
          className="w-[18px]"
          alt="portfolio active icon"
        />
      ),
    },
    label: "แฟ้มผลงาน",
    url: paths.student.portfolio.personalDetails,
    matchPaths: [
      paths.student.portfolio.personalDetails,
      paths.student.portfolio.activities.list,
      paths.student.portfolio.activities.new,
      paths.student.portfolio.awardsCompetitions.list,
      paths.student.portfolio.awardsCompetitions.new,
      paths.student.portfolio.ePortfolio.list,
      paths.student.portfolio.ePortfolio.add,
      paths.student.portfolio.ePortfolio.edit,
      paths.student.portfolio.ePortfolio.view,
      paths.student.portfolio.ePortfolio.workDetail,
      paths.student.portfolio.ePortfolio.experienceDetail,
      paths.student.portfolio.ePortfolio.awardDetail,
      paths.student.portfolio.ePortfolio.certificateDetail,
      paths.student.portfolio.ePortfolio.trainingDetail,
      paths.student.portfolio.ePortfolio.projectDetail,
      paths.student.portfolio.ePortfolio.activityDetail,
      paths.student.portfolio.educationTraining.list,
      paths.student.portfolio.experienceSkills.list,
      paths.student.portfolio.experienceSkills.newExperience,
      paths.student.portfolio.experienceSkills.newSkill,
      paths.student.portfolio.experienceSkills.newThesis,

      paths.student.portfolio.educationTraining.newEducation,
      paths.student.portfolio.educationTraining.newTraining,
      paths.student.portfolio.educationTraining.newCertificate,
      paths.student.portfolio.educationTraining.newProfessionalQualification,
    ],
    subMenuItems: [
      {
        key: "PERSONAL_DETAILS",
        label: "ข้อมูลส่วนตัว",
        url: paths.student.portfolio.personalDetails,
        matchPaths: [paths.student.portfolio.personalDetails],
      },
      {
        key: "EDUCATION_TRAINING",
        label: "การศึกษาและการอบรม",
        url: paths.student.portfolio.educationTraining.list,
        matchPaths: [
          paths.student.portfolio.educationTraining.list,
          paths.student.portfolio.educationTraining.newEducation,
          paths.student.portfolio.educationTraining.newTraining,
          paths.student.portfolio.educationTraining.newCertificate,
          paths.student.portfolio.educationTraining
            .newProfessionalQualification,
        ],
      },
      {
        key: "EXPERIENCE_SKILLS",
        label: "ประสบการณ์และทักษะ",
        url: paths.student.portfolio.experienceSkills.list,
        matchPaths: [
          paths.student.portfolio.experienceSkills.list,
          paths.student.portfolio.experienceSkills.newExperience,
          paths.student.portfolio.experienceSkills.newSkill,
          paths.student.portfolio.experienceSkills.newThesis,
        ],
      },
      {
        key: "AWARDS_COMPETITIONS",
        label: "รางวัลและการแข่งขัน",
        url: paths.student.portfolio.awardsCompetitions.list,
        matchPaths: [
          paths.student.portfolio.awardsCompetitions.list,
          paths.student.portfolio.awardsCompetitions.new,
        ],
      },
      {
        key: "ACTIVITIES",
        label: "กิจกรรมและอื่น ๆ",
        url: paths.student.portfolio.activities.list,
        matchPaths: [
          paths.student.portfolio.activities.list,
          paths.student.portfolio.activities.new,
        ],
      },
      {
        key: "E_PORTFOLIO",
        label: "e-Portfolio",
        url: paths.student.portfolio.ePortfolio.list,
        matchPaths: [
          paths.student.portfolio.ePortfolio.list,
          paths.student.portfolio.ePortfolio.add,
          paths.student.portfolio.ePortfolio.edit,
          paths.student.portfolio.ePortfolio.view,
          paths.student.portfolio.ePortfolio.workDetail,
          paths.student.portfolio.ePortfolio.experienceDetail,
          paths.student.portfolio.ePortfolio.awardDetail,
          paths.student.portfolio.ePortfolio.certificateDetail,
          paths.student.portfolio.ePortfolio.trainingDetail,
          paths.student.portfolio.ePortfolio.projectDetail,
          paths.student.portfolio.ePortfolio.activityDetail,
        ],
      },
    ],
  },
];

const StudentSideBar = () => {
  const { secId } = useParams<{ secId: string }>();

  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();

  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.home);
  const courseSlice = useSelector((state: RootState) => state.studentCourse);

  const handleFetchCourse = async () => {
    if (!secId) return;
    await dispatch(fetchCourseDetail(parseInt(secId)));
  };

  const handleFetchStudentDetail = async () => {
    const result = await dispatch(
      fetchStudentDetail(homeSlice.studentId),
    ).unwrap();
    if (result.data.user_id) {
      await dispatch(fetchPortfolioPersonal(result.data.user_id));
    }
  };

  // const handleMenuOnClick = (menuKey: string) => {
  //   if (menuKey !== "COURSE" && menuKey !== "PORTFOLIO") {
  //     dispatch(homeSliceAction.setIsShowSubMenu(false));
  //   }
  // };

  const handleSubMenuOnClick = (subMenu: string, url: string) => {
    const path = generatePath(url, { secId });
    navigate(path);
    dispatch(homeSliceAction.setSelectedSubMenu(subMenu));
  };

  const getActiveMenuKey = (path: string): string | null => {
    const portfolioMenu = menuItems.find((m) => m.key === "PORTFOLIO");
    if (portfolioMenu) {
      const isMatch = portfolioMenu.matchPaths.some((mp) =>
        matchPath({ path: mp, end: mp === paths.student.root }, path),
      );
      if (isMatch) return portfolioMenu.key;
    }

    for (const menu of menuItems) {
      if (menu.key === "PORTFOLIO") continue;
      const isMatch = menu.matchPaths.some((mp) =>
        matchPath({ path: mp, end: mp === paths.student.root }, path),
      );
      if (isMatch) return menu.key;
    }
    return null;
  };

  const getActiveSubMenuKey = (path: string): string | null => {
    const portfolioMenu = menuItems.find((m) => m.key === "PORTFOLIO");
    if (portfolioMenu && portfolioMenu.subMenuItems) {
      for (const sub of portfolioMenu.subMenuItems) {
        for (const mp of sub.matchPaths) {
          if (matchPath({ path: mp, end: false }, path)) {
            dispatch(homeSliceAction.setIsShowSubMenu(true));
            return sub.key;
          }
        }
      }
    }

    for (const menu of menuItems) {
      if (menu.key === "PORTFOLIO") continue;
      if (menu.subMenuItems) {
        for (const sub of menu.subMenuItems) {
          for (const mp of sub.matchPaths) {
            if (matchPath({ path: mp, end: false }, path)) {
              dispatch(homeSliceAction.setIsShowSubMenu(true));

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

  // handle when select submenu and refresh
  // useEffect(() => {
  //   if (activeSubMenuKey) {
  //     dispatch(homeSliceAction.setIsShowSubMenu(true));
  //   }
  // }, [currentPath]);

  // useEffect(() => {
  //   console.log("menu : ", activeMenuKey);
  //   console.log("submenu : ", activeSubMenuKey);
  //   console.log("open : ", homeSlice.isShowSubmenu);
  // }, [activeMenuKey, activeSubMenuKey]);

  useEffect(() => {
    handleFetchCourse();
    handleFetchStudentDetail();
  }, [secId, homeSlice.studentId]);

  useEffect(() => {
    if (activeSubMenuKey) {
      if (secId) {
        dispatch(fetchCourseDetail(parseInt(secId)));
      } else {
        dispatch(studentCourseSliceAction.setSelectedCourse(null));
      }
      dispatch(homeSliceAction.setIsShowSubMenu(true));
    } else {
      dispatch(homeSliceAction.setIsShowSubMenu(false));
      dispatch(studentCourseSliceAction.setSelectedCourse(null));
    }
  }, [activeSubMenuKey, secId, dispatch, currentPath]);

  return (
    <div className="w-54 2xl:w-75 h-full overflow-y-auto bg-white body-medium-3 drop-shadow-xl">
      <div className="flex flex-col w-full mb-4">
        {!courseSlice.selectedCourse ? (
          <div
            className="2xl:px-12 2xl:py-6 px-6 py-3 text-white flex flex-col body-bold-1"
            style={{ backgroundColor: "rgb(244, 99, 42, 0.9)" }}
          >
            <div>สวัสดี,</div>
            <div>{homeSlice.studentDetail?.first_name_th}</div>
            <div className="caption-regular">
              {homeSlice.studentDetail?.department_name}
            </div>
            <div className="caption-regular">
              ภาคการศึกษา {homeSlice.semester}/{homeSlice.academicYear}{" "}
            </div>
          </div>
        ) : (
          // header course info
          <div
            className="2xl:px-12 2xl:py-6 px-6 py-3 text-white flex flex-col gap-2"
            style={{ backgroundColor: "rgb(244, 99, 42, 0.9)" }}
          >
            <div>
              <div className="body-bold-1">
                {courseSlice.selectedCourse.course_id}
              </div>
              <div className="caption-regular">
                {courseSlice.selectedCourse.course_name_en}
              </div>
            </div>

            <div className="bg-primary-orange py-2 pl-4 caption-regular rounded-xl">
              กลุ่มเรียน {courseSlice.selectedCourse.section_number}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col w-full caption-bold">
        {menuItems.map((menu) => (
          <div key={menu.key}>
            <Link
              className={`w-full flex items-center 2xl:gap-6 2xl:pl-13 2xl:pr-12 2xl:py-5  gap-3 pl-7 pr-6 py-3  cursor-pointer ${
                activeMenuKey === menu.key
                  ? "bg-primary-orange/15 border-r-[5px] border-primary-orange text-primary-orange"
                  : "bg-white text-primary-black border-none"
              }`}
              // onClick={() => handleMenuOnClick(menu.key)}
              to={menu.url}
            >
              <div>
                {activeMenuKey === menu.key
                  ? menu.icon.active
                  : menu.icon.inActive}
              </div>
              <div>{menu.label}</div>
            </Link>

            {menu.subMenuItems &&
              activeMenuKey === menu.key &&
              homeSlice.isShowSubmenu && (
                <div className="flex flex-col py-2">
                  {menu.subMenuItems.map((subMenu) => (
                    <div
                      key={subMenu.key}
                      className={`2xl:pl-25 2xl:py-5 pl-14 py-3  text-primary-grey caption-regular cursor-pointer hover:text-primary-orange ${
                        activeSubMenuKey === subMenu.key
                          ? "border-r-[5px] border-primary-orange text-primary-orange"
                          : "text-primary-black border-none"
                      }`}
                      onClick={() =>
                        handleSubMenuOnClick(subMenu.key, subMenu.url)
                      }
                    >
                      <div>{subMenu.label}</div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentSideBar;
