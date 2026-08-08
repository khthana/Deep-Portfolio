export const paths = {
  root: "/",
  acceptInvite: "/group/accept-invite",
  unauthorized: "/unauthorized",
  login: "/login",
  student: {
    root: "/student",
    course: {
      list: "/student/courses",
      detail: "/student/:secId/detail",
      classwork: {
        list: "/student/:secId/classwork",
        detail: "/student/:secId/:category/:activityId",
      },
      announcement: "/student/:secId/announcement",
      evaluation: {
        list: "/student/:secId/evaluation",
        detail: "/student/:secId/evaluation/:category/:activityId",
      },
    },
    calendar: "/student/calendar",
    portfolio: {
      personalDetails: "/student/portfolio/personal-details",
      educationTraining: {
        list: "/student/portfolio/education-training",
        newEducation: "/student/portfolio/education-training/education/new",
        newTraining: "/student/portfolio/education-training/training/new",
        newCertificate: "/student/portfolio/education-training/certificate/new",
        newProfessionalQualification:
          "/student/portfolio/education-training/professional-qualification/new",
      },
      experienceSkills: {
        list: "/student/portfolio/experience-skills",
        newExperience: "/student/portfolio/experience-skills/experience/new",
        newSkill: "/student/portfolio/experience-skills/skill/new",
        newThesis: "/student/portfolio/experience-skills/thesis/new",
        addSkillWork: (skillId: number) =>
          `/student/portfolio/experience-skills/skill/${skillId}/add-work`,
        addSkillWorkRoute:
          "/student/portfolio/experience-skills/skill/:skillId/add-work",
      },
      awardsCompetitions: {
        list: "/student/portfolio/awards-competitions",
        new: "/student/portfolio/awards-competitions/new",
      },
      activities: {
        list: "/student/portfolio/activities",
        new: "/student/portfolio/activities/new",
      },
      ePortfolio: {
        list: "/student/portfolio/e-portfolio",
        add: "/student/portfolio/e-portfolio/add",
        edit: "/student/portfolio/e-portfolio/:portfolioId/edit",
        view: "/student/portfolio/e-portfolio/:portfolioId/view",
        workDetail: "/student/portfolio/e-portfolio/:portfolioId/work/:workId",
        experienceDetail:
          "/student/portfolio/e-portfolio/:portfolioId/experience/:experienceId",
        awardDetail:
          "/student/portfolio/e-portfolio/:portfolioId/award/:awardId",
        certificateDetail:
          "/student/portfolio/e-portfolio/:portfolioId/certificate/:certificateId",
        trainingDetail:
          "/student/portfolio/e-portfolio/:portfolioId/training/:trainingId",
        projectDetail:
          "/student/portfolio/e-portfolio/:portfolioId/project/:projectId",
        activityDetail:
          "/student/portfolio/e-portfolio/:portfolioId/activity/:activityId",
      },
    },
  },
  teacher: {
    root: "/teacher",
    course: {
      announcement: {
        list: "/teacher/:secId/announcement",
        new: "/teacher/:secId/announcement/new",
      },
      detail: `/teacher/:secId/detail`,

      plan: "/teacher/:secId/plan",
      material: "/teacher/:secId/material",
      mapping: "/teacher/:secId/mapping",

      activity: {
        list: "/teacher/:secId/activity",
        new: "/teacher/:secId/activity/new",
        edit: "/teacher/:secId/activity/:activityId/edit",
        detail: "/teacher/:secId/activity/:activityId",
        grading: "/teacher/:secId/activity/:activityId/:workId",
      },
      learningActivity: {
        list: "/teacher/:secId/learning-activity",
        new: "/teacher/:secId/learning-activity/new",
        edit: "/teacher/:secId/learning-activity/:activityId/edit",
        detail: "/teacher/:secId/learning-activity/:activityId",
        grading: "/teacher/:secId/learning-activity/:activityId/:workId",
      },
      gradebook: "/teacher/:secId/gradebook",

      student: "/teacher/:secId/student",
    },
  },
  public: {
    root: "/p/:shareToken",
    workDetail: "/p/:shareToken/work/:workId",
    experienceDetail: "/p/:shareToken/experience/:experienceId",
    awardDetail: "/p/:shareToken/award/:awardId",
    certificateDetail: "/p/:shareToken/certificate/:certificateId",
    trainingDetail: "/p/:shareToken/training/:trainingId",
    projectDetail: "/p/:shareToken/project/:projectId",
    activityDetail: "/p/:shareToken/activity/:activityId",
  },
};
