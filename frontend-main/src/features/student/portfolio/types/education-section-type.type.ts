export type MockEducationType = {
  id: number;
  startYear: number;
  endYear: number;
  degree: string;
  university: string;
  faculty: string;
  isShow: boolean;
};

export const educationDegreeType = {
  BACHELOR: "BACHELOR",
  HIGH_SCHOOL: "HIGH_SCHOOL",
} as const;

export const educationDegreeLabel: Record<educationDegreeType, string> = {
  BACHELOR: "ปริญญาตรี",
  HIGH_SCHOOL: "มัธยมศึกษาตอนปลาย",
};

export const educationDegreeOptions = Object.keys(educationDegreeType).map(
  (key) => ({
    value: educationDegreeType[key as educationDegreeType],
    label: educationDegreeLabel[key as educationDegreeType],
  }),
);

export type educationDegreeType = keyof typeof educationDegreeType;

//------------------------------------------------------------------------

export type MockTrainingType = {
  year: number;
  name: string;
  organizer: string;
  country: string;
};

export type MockProfessionalQualificationType = {
  year: number;
  name: string;
  organizer: string;
  description: string;
};
