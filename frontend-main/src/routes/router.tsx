import { createBrowserRouter } from "react-router-dom";

import StudentLayout from "../layouts/student-layout";

import { paths } from "./paths.config";
import StudentCalendarPage from "../features/student/calendar/pages/student-calendar-page";
import StudentClassworkDetailPage from "../features/student/course/pages/student-classwork-detail-page";
import StudentCourseAnnouncementPage from "../features/student/course/pages/student-course-announcement-page";
import StudentClassworkListPage from "../features/student/course/pages/student-classwork-list-page";
import StudentCourseDetail from "../features/student/course/pages/student-course-detail-page";
import StudentCourseListPage from "../features/student/course/pages/student-course-list-page";
import StudentCourseEvaluationPage from "../features/student/course/pages/student-course-evaluation-page";
import StudentHomePage from "../features/student/home/pages/student-home-page";
import TeacherLayout from "../layouts/teacher-layout";
import TeacherHomePage from "../features/teacher/home/pages/teacher-home-page";
import TeacherAnnouncementPage from "../features/teacher/announcement/pages/teacher-announcement-page";
import TeacherCourseDetailPage from "../features/teacher/course/pages/teacher-course-detail-page";
import { TeacherLessonPlanPage } from "../features/teacher/lesson-plan/pages/teacher-lesson-plan-page";
import TeacherActivityPage from "../features/teacher/activity/pages/teacher-activity-page";
import TeacherCreateAnnouncementPage from "../features/teacher/announcement/pages/teacher-create-announcement-page";
import TeacherLearningActivityPage from "../features/teacher/learning-activity/pages/teacher-learning-activity-page";
import TeacherMaterialPage from "../features/teacher/material/pages/teacher-material-page";
import TeacherMappingPage from "../features/teacher/mapping/pages/teacher-mapping-page";
import TeacherGradebookPage from "../features/teacher/gradebook/pages/teacher-gradebook-page";
import TeacherStudentPage from "../features/teacher/student/pages/teacher-student-page";
import TeacherCreateActivityPage from "../features/teacher/activity/pages/teacher-create-activity-page";
import TeacherCreateLearningActivityPage from "../features/teacher/learning-activity/pages/teacher-create-learning-activity-page";
import TeacherActivityDetailPage from "../features/teacher/activity/pages/teacher-activity-detail-page";
import TeacherGradingPage from "../features/teacher/activity/pages/teacher-grading-page";
import StudentPersonalDetailsPage from "../features/student/portfolio/pages/personal-details/student-personal-details-page";
import StudentActivitiesPage from "../features/student/portfolio/pages/activities/student-activities-page";
import StudentAwardsCompetitionsPage from "../features/student/portfolio/pages/awards-competitions/student-awards-competitions-page";
import StudentEPortfolioPage from "../features/student/portfolio/pages/e-portfolio/student-e-portfolio-page";
import StudentEducationTrainingPage from "../features/student/portfolio/pages/education-training/student-education-training-page";
import StudentExperienceSkillsPage from "../features/student/portfolio/pages/experience-skills/student-experience-skills-page";
import StudentCreateEducationPage from "../features/student/portfolio/pages/education-training/student-create-education-page";
import StudentCreateTrainingPage from "../features/student/portfolio/pages/education-training/student-create-training-page";
import StudentCreateCertificatePage from "../features/student/portfolio/pages/education-training/student-create-certificate-page";
import StudentCreateProfessionalQualificationPage from "../features/student/portfolio/pages/education-training/student-create-professional-qualification-page";
import StudentCreateAwardsCompetitionsPage from "../features/student/portfolio/pages/awards-competitions/student-create-awards-competitions-page";
import StudentCreateActivitiesPage from "../features/student/portfolio/pages/activities/student-create-activities-page";
import StudentCreateExperiencePage from "../features/student/portfolio/pages/experience-skills/student-create-experience-page";
import StudentCreateThesisPage from "../features/student/portfolio/pages/experience-skills/student-create-thesis-page";
import StudentCreateSkillPage from "../features/student/portfolio/pages/experience-skills/student-create-skill-page";
import StudentEPortfolioViewPage from "../features/student/portfolio/pages/e-portfolio/student-e-portfolio-view-page";
import StudentWorkDetailPage from "../features/student/portfolio/pages/e-portfolio/student-work-detail-page";
import StudentExperienceDetailPage from "../features/student/portfolio/pages/e-portfolio/student-experience-detail-page";
import StudentAwardDetailPage from "../features/student/portfolio/pages/e-portfolio/student-award-detail-page";
import StudentCertificateDetailPage from "../features/student/portfolio/pages/e-portfolio/student-certificate-detail-page";
import StudentTrainingDetailPage from "../features/student/portfolio/pages/e-portfolio/student-training-detail-page";
import StudentProjectDetailPage from "../features/student/portfolio/pages/e-portfolio/student-project-detail-page";
import StudentActivityDetailPage from "../features/student/portfolio/pages/e-portfolio/student-activity-detail-page";
import StudentEditEPortfolioPage from "../features/student/portfolio/pages/e-portfolio/student-edit-e-portfolio-page";

import StudentAddEPortfolioPage from "../features/student/portfolio/pages/e-portfolio/student-add-e-portfolio-page";
import TeacherLearningActivityDetailPage from "../features/teacher/learning-activity/pages/teacher-learning-activity-detail-page";
import TeacherGradingLearningActivityPage from "../features/teacher/learning-activity/pages/teacher-grading-learning-activity-page";
import StudentCourseEvaluationDetailPage from "../features/student/course/pages/student-course-evaluation-detail-page";
import TeacherEditActivityPage from "../features/teacher/activity/pages/teacher-edit-activity-page";
import TeacherEditLearningActivityPage from "../features/teacher/learning-activity/pages/teacher-edit-learning-activity-page";
import StudentAuthGuard from "../guards/student-auth-guard";
import TeacherAuthGuard from "../guards/teacher-auth-guard";
import UnauthorizedPage from "../features/shared/login/pages/unauthorized-page";
import NotFoundPage from "../features/shared/login/pages/not-found-page";
import PublicPortfolioPage from "../features/student/portfolio/pages/e-portfolio/public-portfolio-page";
import AcceptInvitePage from "../features/shared/accept-invite/pages/accept-invite-page";

const router = createBrowserRouter([
  { path: paths.acceptInvite, element: <AcceptInvitePage /> },
  { path: paths.unauthorized, element: <UnauthorizedPage /> },
  { path: paths.public.root, element: <PublicPortfolioPage /> },
  { path: paths.public.workDetail, element: <StudentWorkDetailPage /> },
  {
    path: paths.public.experienceDetail,
    element: <StudentExperienceDetailPage />,
  },
  { path: paths.public.awardDetail, element: <StudentAwardDetailPage /> },
  {
    path: paths.public.certificateDetail,
    element: <StudentCertificateDetailPage />,
  },
  { path: paths.public.trainingDetail, element: <StudentTrainingDetailPage /> },
  { path: paths.public.projectDetail, element: <StudentProjectDetailPage /> },
  { path: paths.public.activityDetail, element: <StudentActivityDetailPage /> },
  {
    path: paths.student.root,
    element: (
      <StudentAuthGuard>
        <StudentLayout />
      </StudentAuthGuard>
    ),
    children: [
      {
        index: true,
        element: <StudentHomePage />,
      },
      {
        path: paths.student.course.list,
        element: <StudentCourseListPage />,
      },
      {
        path: paths.student.course.classwork.list,
        element: <StudentClassworkListPage />,
      },
      {
        path: paths.student.course.classwork.detail,
        element: <StudentClassworkDetailPage />,
      },
      {
        path: paths.student.course.detail,
        element: <StudentCourseDetail />,
      },
      {
        path: paths.student.course.announcement,
        element: <StudentCourseAnnouncementPage />,
      },
      {
        path: paths.student.course.evaluation.list,
        element: <StudentCourseEvaluationPage />,
      },
      {
        path: paths.student.course.evaluation.detail,
        element: <StudentCourseEvaluationDetailPage />,
      },
      {
        path: paths.student.calendar,
        element: <StudentCalendarPage />,
      },

      // portfolio--------------------------------------------------
      {
        path: paths.student.portfolio.personalDetails,
        element: <StudentPersonalDetailsPage />,
      },

      // activity--------------------------------------------------
      {
        path: paths.student.portfolio.activities.list,
        element: <StudentActivitiesPage />,
      },
      {
        path: paths.student.portfolio.activities.new,
        element: <StudentCreateActivitiesPage />,
      },

      // award competition--------------------------------------------------
      {
        path: paths.student.portfolio.awardsCompetitions.list,
        element: <StudentAwardsCompetitionsPage />,
      },
      {
        path: paths.student.portfolio.awardsCompetitions.new,
        element: <StudentCreateAwardsCompetitionsPage />,
      },

      {
        path: paths.student.portfolio.ePortfolio.list,
        element: <StudentEPortfolioPage />,
      },
      {
        path: paths.student.portfolio.ePortfolio.add,
        element: <StudentAddEPortfolioPage />,
      },
      {
        path: paths.student.portfolio.ePortfolio.edit,
        element: <StudentEditEPortfolioPage />,
      },
      {
        path: paths.student.portfolio.ePortfolio.view,
        element: <StudentEPortfolioViewPage />,
      },
      {
        path: paths.student.portfolio.ePortfolio.workDetail,
        element: <StudentWorkDetailPage />,
      },
      {
        path: paths.student.portfolio.ePortfolio.experienceDetail,
        element: <StudentExperienceDetailPage />,
      },
      {
        path: paths.student.portfolio.ePortfolio.awardDetail,
        element: <StudentAwardDetailPage />,
      },
      {
        path: paths.student.portfolio.ePortfolio.certificateDetail,
        element: <StudentCertificateDetailPage />,
      },
      {
        path: paths.student.portfolio.ePortfolio.trainingDetail,
        element: <StudentTrainingDetailPage />,
      },
      {
        path: paths.student.portfolio.ePortfolio.projectDetail,
        element: <StudentProjectDetailPage />,
      },
      {
        path: paths.student.portfolio.ePortfolio.activityDetail,
        element: <StudentActivityDetailPage />,
      },

      // education-training--------------------------------------------------
      {
        path: paths.student.portfolio.educationTraining.list,
        element: <StudentEducationTrainingPage />,
      },
      {
        path: paths.student.portfolio.educationTraining.newEducation,
        element: <StudentCreateEducationPage />,
      },
      {
        path: paths.student.portfolio.educationTraining.newTraining,
        element: <StudentCreateTrainingPage />,
      },
      {
        path: paths.student.portfolio.educationTraining.newCertificate,
        element: <StudentCreateCertificatePage />,
      },
      {
        path: paths.student.portfolio.educationTraining
          .newProfessionalQualification,
        element: <StudentCreateProfessionalQualificationPage />,
      },

      // experience skill thesis--------------------------------------------------
      {
        path: paths.student.portfolio.experienceSkills.list,
        element: <StudentExperienceSkillsPage />,
      },
      {
        path: paths.student.portfolio.experienceSkills.newSkill,
        element: <StudentCreateSkillPage />,
      },
      {
        path: paths.student.portfolio.experienceSkills.newExperience,
        element: <StudentCreateExperiencePage />,
      },
      {
        path: paths.student.portfolio.experienceSkills.newThesis,
        element: <StudentCreateThesisPage />,
      },
    ],
  },
  {
    path: paths.teacher.root,
    element: (
      <TeacherAuthGuard>
        <TeacherLayout />
      </TeacherAuthGuard>
    ),
    children: [
      {
        index: true,
        element: <TeacherHomePage />,
      },
      {
        path: paths.teacher.course.announcement.list,
        element: <TeacherAnnouncementPage />,
      },
      {
        path: paths.teacher.course.announcement.new,
        element: <TeacherCreateAnnouncementPage />,
      },

      {
        path: paths.teacher.course.detail,
        element: <TeacherCourseDetailPage />,
      },

      {
        path: paths.teacher.course.plan,
        element: <TeacherLessonPlanPage />,
      },

      {
        path: paths.teacher.course.activity.list,
        element: <TeacherActivityPage />,
      },
      {
        path: paths.teacher.course.activity.new,
        element: <TeacherCreateActivityPage />,
      },
      {
        path: paths.teacher.course.activity.edit,
        element: <TeacherEditActivityPage />,
      },
      {
        path: paths.teacher.course.activity.detail,
        element: <TeacherActivityDetailPage />,
      },
      {
        path: paths.teacher.course.activity.grading,
        element: <TeacherGradingPage />,
      },

      {
        path: paths.teacher.course.learningActivity.list,
        element: <TeacherLearningActivityPage />,
      },
      {
        path: paths.teacher.course.learningActivity.new,
        element: <TeacherCreateLearningActivityPage />,
      },
      {
        path: paths.teacher.course.learningActivity.edit,
        element: <TeacherEditLearningActivityPage />,
      },
      {
        path: paths.teacher.course.learningActivity.detail,
        element: <TeacherLearningActivityDetailPage />,
      },
      {
        path: paths.teacher.course.learningActivity.grading,
        element: <TeacherGradingLearningActivityPage />,
      },

      {
        path: paths.teacher.course.gradebook,
        element: <TeacherGradebookPage />,
      },

      {
        path: paths.teacher.course.material,
        element: <TeacherMaterialPage />,
      },

      {
        path: paths.teacher.course.mapping,
        element: <TeacherMappingPage />,
      },

      {
        path: paths.teacher.course.student,
        element: <TeacherStudentPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
