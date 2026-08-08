import { configureStore } from "@reduxjs/toolkit";
import { calendarSlice } from "../features/student/calendar/stores/calendar-slice";
import { homeSlice } from "../features/student/home/stores/home-slice";
import { studentCourseSlice } from "../features/student/course/stores/course-slice";
import { teacherAnnouncementSlice } from "../features/teacher/announcement/stores/announcement-slice";
import { teacherHomeSlice } from "../features/teacher/home/stores/teacher-home-slice";
import { teacherCourseSlice } from "../features/teacher/course/stores/teacher-course-slice";
import { teacherLessonPlanSlice } from "../features/teacher/lesson-plan/stores/teacher-lesson-plan-slice";
import { teacherActivitySlice } from "../features/teacher/activity/stores/teacher-activity-slice";
import { teacherLearningActivitySlice } from "../features/teacher/learning-activity/stores/teacher-learning-activity-slice";
import { teacherStudentSlice } from "../features/teacher/student/stores/teacher-student-slice";
import { teacherGradebookSlice } from "../features/teacher/gradebook/stores/teacher-gradebook-slice";
import { teacherActivityCLOMappingSlice } from "../features/teacher/mapping/stores/teacher-mapping-slice";
import { teacherCourseMaterialSlice } from "../features/teacher/material/stores/teacher-material-slice";
import { groupSlice } from "../features/shared/accept-invite/stores/teacher-home-slice";

export const makeStore = () =>
  configureStore({
    reducer: {
      [groupSlice.name]: groupSlice.reducer,

      [homeSlice.name]: homeSlice.reducer,
      [studentCourseSlice.name]: studentCourseSlice.reducer,
      [calendarSlice.name]: calendarSlice.reducer,

      [teacherAnnouncementSlice.name]: teacherAnnouncementSlice.reducer,
      [teacherHomeSlice.name]: teacherHomeSlice.reducer,
      [teacherCourseSlice.name]: teacherCourseSlice.reducer,
      [teacherLessonPlanSlice.name]: teacherLessonPlanSlice.reducer,
      [teacherActivitySlice.name]: teacherActivitySlice.reducer,
      [teacherLearningActivitySlice.name]: teacherLearningActivitySlice.reducer,
      [teacherStudentSlice.name]: teacherStudentSlice.reducer,
      [teacherGradebookSlice.name]: teacherGradebookSlice.reducer,
      [teacherActivityCLOMappingSlice.name]:
        teacherActivityCLOMappingSlice.reducer,
      [teacherCourseMaterialSlice.name]: teacherCourseMaterialSlice.reducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;

export type RootState = ReturnType<AppStore["getState"]>;

export type AppDispatch = AppStore["dispatch"];
