export type MockSkillType = {
  skill: string;
  classwork: MockClassworkType[];
};

export type MockClassworkType = {
  name: string;
  subject: string;
  subject_code: string;
};

//-----------------------------------

export type MockExperienceType = {
  year: number;
  position: string;
  company: string;
  province: string;
};

export const ProgramType = {
  INTERNSHIP: "INTERN",
  COOP: "COOP",
} as const;

export const programLabel: Record<ProgramType, string> = {
  INTERNSHIP: "ฝึกงาน",
  COOP: "สหกิจศึกษา",
};

export const programOptions = Object.keys(ProgramType).map((key) => ({
  value: ProgramType[key as ProgramType],
  label: programLabel[key as ProgramType],
}));

export type ProgramType = keyof typeof ProgramType;
export type ProgramTypeValue = (typeof ProgramType)[ProgramType];

//-----------------------------------

export type MockThesisType = {
  thesis_name: string;
  attachment: MockThesisAttachment[];
};

export type MockThesisAttachment = {
  name: string;
  type: MockThesisAttachmentType;
};

export const MockThesisAttachmentType = {
  REPORT: "REPORT",
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
} as const;

export const mockThesisAttachmentLabel: Record<
  MockThesisAttachmentType,
  string
> = {
  REPORT: "รายงาน",
  IMAGE: "รูปภาพ",
  VIDEO: "วิดีโอ",
};

export const mockThesisAttachmentIcon: Record<
  MockThesisAttachmentType,
  string
> = {
  REPORT: "/assets/portfolio/file-orange-icon.svg",
  IMAGE: "/assets/portfolio/image-orange-icon.svg",
  VIDEO: "/assets/portfolio/video-orange-icon.svg",
};

export type MockThesisAttachmentType = keyof typeof MockThesisAttachmentType;
