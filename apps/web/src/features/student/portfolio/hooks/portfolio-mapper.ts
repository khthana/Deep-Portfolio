import type { PortfolioPersonalDetail } from "@deep-portfolio/api-types";
import type {
  PersonalInfo,
  ContactInfo,
} from "../components/e-portfolio-template/types";

/**
 * Whose name and contact details the header shows.
 *
 * Neither `UserResp` nor `StudentDetail`, but the four fields both of them
 * carry: the two hooks that call this read the owner from different endpoints
 * — `GET /user` for the student's own screens, and the aggregate's `userData`
 * for a shared link — and only these four are read from either (#68).
 */
export type PortfolioOwner = {
  first_name_th?: string | null;
  last_name_th?: string | null;
  email?: string | null;
  phone?: string | null;
};

/**
 * Normalizes string values from the API.
 * Converts "null", "undefined", null, or empty strings to undefined.
 */
export const normalizeValue = (val: unknown): string | undefined => {
  if (val === null || val === undefined) return undefined;
  const s = String(val).trim();
  if (s === "null" || s === "undefined") return undefined;
  return s;
};

/**
 * Centralized mapper for contact information.
 * Prioritizes portfolio-specific overrides, then user profile data.
 * Always returns a clean ContactInfo object where missing data is undefined.
 */
export const mapContactInfo = (
  portfolioPersonal?: PortfolioPersonalDetail | null,
  userProfile?: PortfolioOwner | null,
): ContactInfo => {
  return {
    email:
      normalizeValue(portfolioPersonal?.email) ??
      normalizeValue(userProfile?.email) ??
      "",
    phone:
      normalizeValue(portfolioPersonal?.phone_number) ??
      normalizeValue(userProfile?.phone),
    github: normalizeValue(portfolioPersonal?.github),
    linkedin: normalizeValue(portfolioPersonal?.linkedin),
  };
};

/**
 * Centralized mapper for personal information.
 */
export const mapPersonalInfo = (
  userData: PortfolioOwner | null,
  portfolioPersonal: PortfolioPersonalDetail | null,
  defaults: {
    firstName: string;
    lastName: string;
    fullName: string;
    profileImageUrl: string;
  },
): PersonalInfo => {
  const firstName =
    normalizeValue(userData?.first_name_th) ?? defaults.firstName;
  const lastName = normalizeValue(userData?.last_name_th) ?? defaults.lastName;

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim() || defaults.fullName,
    profileImageUrl:
      normalizeValue(portfolioPersonal?.attachments?.url) ??
      defaults.profileImageUrl,
    contact: mapContactInfo(portfolioPersonal, userData),
  };
};

/**
 * Formats a year into Buddhist calendar if it is in AD.
 */
export const formatBuddhistYear = (year: number | null | undefined): string => {
  if (!year) return "";
  const y = Number(year);
  return (y < 2400 ? y + 543 : y).toString();
};

/**
 * Maps education level to Thai label.
 */
export const mapEducationLevel = (
  level: string,
  studyPlan?: string | null,
): string => {
  if (level === "BACHELOR") return "ปริญญาตรี";
  if (level === "HIGH_SCHOOL" || level === "มัธยมปลาย") {
    return studyPlan ? `แผนการเรียน ${studyPlan}` : "มัธยมปลาย";
  }
  return level;
};
