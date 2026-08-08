import type { PersonalInfo, ContactInfo } from "../components/e-portfolio-template/types";

/**
 * Normalizes string values from the API.
 * Converts "null", "undefined", null, or empty strings to undefined.
 */
export const normalizeValue = (val: any): string | undefined => {
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
  portfolioPersonal?: any,
  userProfile?: any
): ContactInfo => {
  return {
    email: normalizeValue(portfolioPersonal?.email) ?? normalizeValue(userProfile?.email) ?? "",
    phone: normalizeValue(portfolioPersonal?.phone_number) ?? normalizeValue(userProfile?.phone),
    github: normalizeValue(portfolioPersonal?.github),
    linkedin: normalizeValue(portfolioPersonal?.linkedin),
    website: normalizeValue(portfolioPersonal?.website),
  };
};

/**
 * Centralized mapper for personal information.
 */
export const mapPersonalInfo = (
  userData: any,
  portfolioPersonal: any,
  defaults: { firstName: string; lastName: string; fullName: string; profileImageUrl: string }
): PersonalInfo => {
  const firstName = normalizeValue(userData?.first_name_th) ?? defaults.firstName;
  const lastName = normalizeValue(userData?.last_name_th) ?? defaults.lastName;
  
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim() || defaults.fullName,
    profileImageUrl: normalizeValue(portfolioPersonal?.attachments?.url) ?? defaults.profileImageUrl,
    contact: mapContactInfo(portfolioPersonal, userData),
  };
};

/**
 * Formats a year into Buddhist calendar if it is in AD.
 */
export const formatBuddhistYear = (year: any): string => {
  if (!year) return "";
  const y = Number(year);
  return (y < 2400 ? y + 543 : y).toString();
};

/**
 * Maps education level to Thai label.
 */
export const mapEducationLevel = (level: string, studyPlan?: string): string => {
  if (level === "BACHELOR") return "ปริญญาตรี";
  if (level === "HIGH_SCHOOL" || level === "มัธยมปลาย") {
    return studyPlan ? `แผนการเรียน ${studyPlan}` : "มัธยมปลาย";
  }
  return level;
};

