import type {
  PortfolioData,
  PortfolioConfig,
  UserData,
} from "../components/e-portfolio-template/types";

/**
 * MOCK USER DATA
 * This represents the user's static content that is shared across all portfolios
 * One user can create multiple portfolios using this same data
 */
export const MOCK_USER_DATA: UserData = {
  userId: "user-1",
  personalInfo: {
    firstName: "พัทธนันท์",
    lastName: "เชื้อแหลม",
    fullName: "พัทธนันท์ เชื้อแหลม",
    profileImageUrl: "/assets/navbar/user-image.svg",
    contact: {
      email: "nannicha@gmail.com",
      linkedin: "https://linkedin.com/in/example",
      github: "https://github.com/24thofmayy",
      phone: "081-234-5678",
    },
  },
  education: [],
  works: [],
  experiences: [],
  awards: [],
  certificates: [],
  trainings: [],
  projects: [],
  activities: [],
  skills: [],
};

export const MOCK_PORTFOLIO_CONFIG_1: PortfolioConfig = {
  id: "portfolio-1",
  userId: "user-1",
  templateId: "template-1",
  portfolioName: "My e-Portfolio",
  templateName: "Modern Blue",
  templateColor: "#126855ff",
  about_me:
    "นักศึกษาวิศวกรรมคอมพิวเตอร์ ชั้นปีที่ 4 ผู้มีความมุ่งมั่นในด้าน Frontend Development และ UX/UI Design มีทักษะในการบริหารจัดการงานและประสานงาน เพื่อส่งมอบประสบการณ์ผู้ใช้งาน (User Experience) ที่มีประสิทธิภาพและสร้างผลลัพธ์ที่ดีเลิศ",
  isShowPersonal: true,
  isShowEducation: true,
  isShowTraining: true,
  isShowCertificate: true,
  isShowSkill: true,
  isShowIntern: true,
  isShowThesis: true,
  isShowAward: true,
  isShowActivity: true,
  selectedSkillIds: ["skill-1", "skill-2", "skill-3"],
};

export const MOCK_PORTFOLIO_CONFIG_2: PortfolioConfig = {
  id: "portfolio-2",
  userId: "user-1",
  templateId: "template-2",
  portfolioName: "Job Application Portfolio",
  templateName: "Modern Blue",
  templateColor: "#0e305cff",
  about_me:
    "Experienced Frontend Developer focused on React and scalable web applications.",
  isShowPersonal: true,
  isShowEducation: true,
  isShowTraining: false,
  isShowCertificate: true,
  isShowSkill: true,
  isShowIntern: true,
  isShowThesis: true,
  isShowAward: false,
  isShowActivity: false,
  selectedSkillIds: ["skill-3"],
};

export const MOCK_PORTFOLIO_DATA: PortfolioData = {
  ...MOCK_PORTFOLIO_CONFIG_1,
  ...MOCK_USER_DATA,
};
