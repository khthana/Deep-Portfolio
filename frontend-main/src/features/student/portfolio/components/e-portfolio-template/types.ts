export interface PortfolioTheme {
  primaryColor: string;
  secondaryColor?: string;
  backgroundColor?: string;
  cardColor?: string;
  textMainColor?: string;
  textSubColor?: string;
}

export interface ContactInfo {
  email: string;
  linkedin?: string;
  github?: string;
  phone?: string;
  website?: string;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  fullName: string;
  profileImageUrl?: string;
  contact: ContactInfo;
}

export interface Education {
  id: string;
  startDate: string;
  endDate?: string;
  degree: string;
  institution: string;
  field?: string;
  location?: string;
  isShow?: boolean;
}

export interface WorkAttachment {
  id: string;
  fileType: string;
  fileName: string;
  url?: string;
}

export interface Skill {
  id: string;
  name: string;
  userId?: string;
}

export interface Work {
  id: string;
  title: string;
  subtitle: string;
  subjectId?: string;
  repositoryUrl?: string;
  roleAndResp?: string;
  isShowRole?: boolean;
  initialExpectation?: string;
  isShowExpectation?: boolean;
  reflection?: string;
  isShowReflection?: boolean;
  isShowRepo?: boolean;
  feedback?: string;
  relatedSkillIds?: string[];
  attachments?: WorkAttachment[];
}

export interface ExperienceAttachment {
  id: string;
  fileType: string;
  fileName: string;
  url?: string;
}

export interface Experience {
  // position: ReactNode;
  id: string;
  title: string;
  year: string;
  company: string;
  location: string;
  type?: "intern" | "coop";
  country?: string;
  province?: string;
  startDate?: string;
  endDate?: string;
  position: string;
  resp?: string;
  isShowResp?: boolean;
  learningOutcome?: string;
  isShowLearning?: boolean;
  reflection?: string;
  isShowReflection?: boolean;
  attachments?: ExperienceAttachment[];
}

export interface Award {
  id: string;
  name: string;
  award: string;
  organizer: string;
  date: string;
  description?: string;
  isShow?: boolean;
  attachments?: ExperienceAttachment[];
}

export interface Certificate {
  id: string;
  userId?: string;
  name: string;
  organizer: string;
  date: string;
  description?: string;
  isShow?: boolean;
  attachments?: ExperienceAttachment[];
}

export interface Training {
  id: string;
  userId?: string;
  year: string;
  date?: string;
  country?: string;
  organize: string;
  name: string;
  description?: string;
  isShow?: boolean;
  attachments?: ExperienceAttachment[];
}

export interface Project {
  id: string;
  title: string;
  tag: string;
  description: string;
  repositoryUrl?: string;
  roleAndResp?: string;
  isShowRole?: boolean;
  initialExpectation?: string;
  isShowInitialExpectation?: boolean;
  reflection?: string;
  isShowReflection?: boolean;
  feedback?: string;
  attachments?: WorkAttachment[];
}

export interface Activity {
  id: string;
  year: string;
  title: string;
  role: string;
  description?: string;
  date?: string;
  attachments?: ExperienceAttachment[];
}

export interface PortfolioConfig {
  id: string;
  userId: string;
  templateId: string;
  portfolioName: string;
  templateName: string;
  templateColor: string;
  about_me?: string;
  isShowPersonal?: boolean;
  isShowEducation?: boolean;
  isShowTraining?: boolean;
  isShowCertificate?: boolean;
  isShowSkill?: boolean;
  isShowIntern?: boolean;
  isShowThesis?: boolean;
  isShowAward?: boolean;
  isShowActivity?: boolean;
  selectedSkillIds?: string[];
  publicShareToken?: string | null;
  shareExpiresAt?: Date | null;
}

export interface UserData {
  userId: string;
  personalInfo: PersonalInfo;
  education: Education[];
  works: Work[];
  experiences: Experience[];
  awards: Award[];
  certificates: Certificate[];
  trainings: Training[];
  projects: Project[];
  activities: Activity[];
  skills?: Skill[];
}

export interface PortfolioData extends PortfolioConfig {
  personalInfo: PersonalInfo;
  education: Education[];
  works: Work[];
  experiences: Experience[];
  awards: Award[];
  certificates: Certificate[];
  trainings: Training[];
  projects: Project[];
  activities: Activity[];
  skills?: Skill[];
  portfolioId?: string;
}

export interface EPortfolioTemplateProps {
  data: PortfolioData;
  theme?: PortfolioTheme;
  isReadOnly?: boolean;
}
