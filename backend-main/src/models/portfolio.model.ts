export type CreatePortfolioReqBody = {
  user_id: string;
  template_id?: number;
  portfolio_name?: string;
  template_color?: string;
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
  selectedSkillIds?: number[];
};

export type UpdatePortfolioReqBody = Partial<CreatePortfolioReqBody>;

export type PortfolioResp = {
  id: string;
  userId: string;
  templateId: number | null;
  portfolioName: string | null;
  templateColor: string | null;
  about_me: string | null;
  isShowPersonal: boolean;
  isShowEducation: boolean;
  isShowTraining: boolean;
  isShowCertificate: boolean;
  isShowSkill: boolean;
  isShowIntern: boolean;
  isShowThesis: boolean;
  isShowAward: boolean;
  isShowActivity: boolean;
  selectedSkillIds: number[];
  templateName?: string | null;
  publicShareToken?: string | null;
  shareExpiresAt?: Date | null;
};
export type PortfolioTemplateResp = {
  id: number;
  name: string;
};
