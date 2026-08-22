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

/**
 * One submission shown on a portfolio, as the templates read it.
 *
 * The optional fields take null as well as undefined because the public hook
 * spreads `PublicPortfolioWork` straight in and the API answers the mapping's
 * columns as Prisma read them. Every template guards these with `&&`, which
 * treats the two the same; the type used to say only one of them arrives.
 */
export interface Work {
  id: string;
  title: string;
  subtitle: string;
  /** `activities.section_id`. Both hooks have always put a number here. */
  subjectId?: number | null;
  repositoryUrl?: string | null;
  roleAndResp?: string | null;
  isShowRole?: boolean | null;
  initialExpectation?: string | null;
  isShowExpectation?: boolean | null;
  reflection?: string | null;
  isShowReflection?: boolean | null;
  isShowRepo?: boolean | null;
  feedback?: string | null;
  relatedSkillIds?: string[];
  /**
   * The same skills again, named. Only the public hook fills it in, and no
   * template reads it — the work section resolves `relatedSkillIds` against
   * `data.skills` instead. What does read it is the work detail page, which
   * declares an `ExtendedWork` of its own to say so: on the private route it
   * builds the list from its own fetch, and on the public one it takes this
   * hook's work whole. Declared here because the key is really there (#68).
   */
  relatedSkills?: { id: string; name: string }[];
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

/**
 * The cover page as the templates read it.
 *
 * A view model, not a response: `selectedSkillIds` are strings here because
 * every id a template holds is one, and `PortfolioDetail` in
 * @deep-portfolio/api-types is what the API actually answers. The two used to
 * be the same declaration, with the response written as this shape minus two
 * fields — so what the API sends could not be written down without changing
 * what the templates read, and six fields were wrong (#68).
 *
 * Five of these are nullable because the response is: nothing on the way in
 * makes a portfolio name itself, pick a template, pick a colour or write an
 * "about me", and a share link need not expire. Every screen that reads one of
 * them already carried a `??` of its own, which is the shape of the code that
 * knows a type is lying to it.
 */
export interface PortfolioConfig {
  id: string;
  userId: string;
  templateId: number | null;
  portfolioName: string | null;
  templateName: string | null;
  templateColor: string | null;
  about_me: string | null;
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
  /** ISO 8601. A `Date` here was a copy of the Prisma column, not the wire. */
  shareExpiresAt?: string | null;
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
