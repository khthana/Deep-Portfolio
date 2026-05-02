import { Router } from "express";
import courseRouter from "./course.route";
import userRouter from "./user.route";
import announcementRouter from "./announcement.route";
import scoreWeightRouter from "./score-weight.route";
import lessonPlanRouter from "./lesson-plan.route";
import rubricRouter from "./rubric.route";
import activityRouter from "./activity.route";
import learningActivityRouter from "./learning-activity.route";
import studentRouter from "./student.route";
import activityCLOMappingRouter from "./activity-clo-mapping.route";
import learningActivityCLOMappingRouter from "./learning-activity-clo-mapping.route";
import studentActivityRouter from "./student-activity.route";
import portfolioPersonalRouter from "./portfolio-personal.routes";
import portfolioEducationRouter from "./portfolio-education.routes";
import portfolioTrainingRouter from "./portfolio-training.routes";
import portfolioCertificateRouter from "./portfolio-certificate.routes";
import studentActivityGroupRouter from "./student-activity-group.route";
import portfolioInternshipRouter from "./portfolio-internship.routes";
import portfolioAwardRouter from "./portfolio-award.routes";
import portfolioThesisRouter from "./portfolio-thesis.routes";
import portfolioActivityRouter from "./portfolio-activity.routes";
import portfolioSkillRouter from "./portfolio-skill.routes";
import studentLearningActivityRouter from "./student-learning-activity.route";
import gradebookRouter from "./gradebook.route";
import courseMaterialRouter from "./course-material.route";
import studentLearningActivityGroupRouter from "./student-learning-activity-group.route";
import evaluationRouter from "./evaluation.route";
import authRouter from "./auth.route";
import portfolioRouter from "./portfolio.routes";
import groupRouter from "./group.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/course", courseRouter);
router.use("/user", userRouter);
router.use("/group", groupRouter);
router.use("/announcement", announcementRouter);
router.use("/score-weight", scoreWeightRouter);
router.use("/lesson-plan", lessonPlanRouter);
router.use("/rubric", rubricRouter);
router.use("/activity", activityRouter);
router.use("/learning-activity", learningActivityRouter);
router.use("/student", studentRouter);
router.use("/mapping/activity", activityCLOMappingRouter);
router.use("/mapping/learning-activity", learningActivityCLOMappingRouter);
router.use("/student-activity", studentActivityRouter);
router.use("/student-learning-activity", studentLearningActivityRouter);
router.use(
  "/student-learning-activity-group",
  studentLearningActivityGroupRouter,
);
router.use("/student-activity-group", studentActivityGroupRouter);
router.use("/gradebook", gradebookRouter);
router.use("/course-material", courseMaterialRouter);
router.use("/portfolio-personal", portfolioPersonalRouter);
router.use("/portfolio-education", portfolioEducationRouter);
router.use("/portfolio-training", portfolioTrainingRouter);
router.use("/portfolio-certificate", portfolioCertificateRouter);
router.use("/portfolio-internship", portfolioInternshipRouter);
router.use("/portfolio-award", portfolioAwardRouter);
router.use("/portfolio-thesis", portfolioThesisRouter);
router.use("/portfolio-activity", portfolioActivityRouter);
router.use("/portfolio-skill", portfolioSkillRouter);
router.use("/portfolio", portfolioRouter);
router.use("/evaluation", evaluationRouter);

export default router;
