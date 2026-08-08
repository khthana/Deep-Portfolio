import { useState, useEffect } from "react";
import { BACKEND_API_URL } from "../../../../lib/axios";
import { getFile } from "../../../../utils/get-file";
import type {
  PortfolioData,
  Work,
} from "../components/e-portfolio-template/types";
import {
  MOCK_PORTFOLIO_CONFIG_1,
  MOCK_PORTFOLIO_CONFIG_2,
} from "../data/mock-portfolio-data";
import {
  mapPersonalInfo,
  formatBuddhistYear,
  mapEducationLevel,
} from "./portfolio-mapper";
import { getUser } from "../../../../services/user.service";
import { getPortfolioPersonal } from "../../../../services/portfolio-personal.service";
import { getAllPortfolioEducation } from "../../../../services/portfolio-education.service";
import { getAllPortfolioTraining } from "../../../../services/portfolio-training.service";
import { getAllPortfolioCertificate } from "../../../../services/portfolio-certificate.service";
import { getAllPortfolioInternship } from "../../../../services/portfolio-internship.service";
import { getAllPortfolioAward } from "../../../../services/portfolio-award.service";
import { getAllPortfolioActivity } from "../../../../services/portfolio-activity.service";
import { getAllPortfolioThesis } from "../../../../services/portfolio-thesis.service";

import { getAllPortfolioSkill } from "../../../../services/portfolio-skill.service";
import { getPortfolioById } from "../../../../services/portfolio.service";
import {
  getActivityDetails,
  getStudentActivityAttachments,
} from "../../../../services/student.service";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../stores/stores";

export interface UsePortfolioResult {
  data: PortfolioData | null;
  loading: boolean;
  error: Error | null;
}

export const usePortfolio = (
  id: string = "portfolio-1",
  skip: boolean = false,
): UsePortfolioResult => {
  const homeSlice = useSelector((state: RootState) => state.home);

  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!homeSlice.studentId) {
        setLoading(false);
        return;
      }
      if (skip) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);

        let matchedConfig = null;

        if (id) {
          const configRes = await getPortfolioById(id);
          if (configRes.success) {
            matchedConfig = configRes.data;
          }
        }

        if (!matchedConfig) {
          // Fallback for mock IDs or when not found
          if (id === MOCK_PORTFOLIO_CONFIG_1.id) {
            matchedConfig = MOCK_PORTFOLIO_CONFIG_1;
          } else if (id === MOCK_PORTFOLIO_CONFIG_2.id) {
            matchedConfig = MOCK_PORTFOLIO_CONFIG_2;
          } else {
            matchedConfig = MOCK_PORTFOLIO_CONFIG_1;
          }
        }

        const studentId = homeSlice.studentId;
        if (!studentId) {
          setLoading(false);
          return;
        }

        const [
          userResponse,
          portfolioResponse,
          educationResponse,
          trainingResponse,
          certificateResponse,
          internshipResponse,
          awardResponse,
          activityResponse,
          skillsResponse,
          thesisResponse,
        ] = await Promise.all([
          getUser(studentId),
          getPortfolioPersonal(studentId),
          getAllPortfolioEducation(studentId),
          getAllPortfolioTraining(studentId),
          getAllPortfolioCertificate(studentId),
          getAllPortfolioInternship(studentId),
          getAllPortfolioAward(studentId),
          getAllPortfolioActivity(studentId),
          getAllPortfolioSkill(studentId),
          getAllPortfolioThesis(studentId),
        ]);

        const cleanNullStr = (val: any): any => {
          if (val === "null" || val === "undefined") return "";
          if (Array.isArray(val)) return val.map(cleanNullStr);
          if (val !== null && typeof val === "object") {
            return Object.fromEntries(
              Object.entries(val).map(([k, v]) => [k, cleanNullStr(v)]),
            );
          }
          return val;
        };

        const userData = cleanNullStr(userResponse.data);
        const portfolioPersonalData = cleanNullStr(portfolioResponse.data);
        const educationData: any[] = cleanNullStr(educationResponse.data) || [];
        const trainingData: any[] = cleanNullStr(trainingResponse.data) || [];
        const certificateData: any[] =
          cleanNullStr(certificateResponse.data) || [];
        const internshipData: any[] =
          cleanNullStr(internshipResponse.data) || [];
        const awardData: any[] = cleanNullStr(awardResponse.data) || [];
        const activityData: any[] = cleanNullStr(activityResponse.data) || [];
        const skillsData: any[] = cleanNullStr(skillsResponse.data) || [];
        const thesisData: any[] = cleanNullStr(thesisResponse.data) || [];

        // Fetch details for each skill mapping to build the "works" list
        const workDetailsPromises: Promise<
          [
            Record<string, unknown>,
            Record<string, unknown>,
            Record<string, unknown>,
          ]
        >[] = [];
        const skillMap: Record<number, Record<string, unknown>> = {};

        for (const skill of skillsData) {
          if (skill.mappings && skill.mappings.length > 0) {
            for (const mapping of skill.mappings) {
              skillMap[mapping.id] = skill;
              workDetailsPromises.push(
                Promise.all([
                  getActivityDetails(mapping.student_activity_id),
                  getStudentActivityAttachments(mapping.student_activity_id),
                  Promise.resolve(mapping),
                ]),
              );
            }
          }
        }

        const workDetailsResults = await Promise.all(workDetailsPromises);
        const realWorksMap = new Map<string, Work>();

        for (const [
          detailsRes,
          attachmentsRes,
          mappingItem,
        ] of workDetailsResults) {
          const mapping = mappingItem as {
            student_activity_id: number;
            id: number;
            repository?: string;
            isShowRepo?: boolean;
            role_and_resp?: string;
            isShowRole?: boolean;
            init_expect?: string;
            isShowInit?: boolean;
            reflection?: string;
            isShowReflec?: boolean;
          };
          if (detailsRes.success) {
            const activity = detailsRes.data as {
              activities?: { activity_name?: string; section_id?: string };
              course?: { course_name_en?: string; course_name_th?: string };
              feedback?: string;
            };
            const skill = skillMap[mapping.id] as { id: number };
            const workId = String(mapping.student_activity_id);

            if (realWorksMap.has(workId)) {
              // Merge related skills if work already exists
              const existingWork = realWorksMap.get(workId) as {
                relatedSkillIds: string[];
              };
              if (!existingWork.relatedSkillIds.includes(String(skill.id))) {
                existingWork.relatedSkillIds.push(String(skill.id));
              }
            } else {
              realWorksMap.set(workId, {
                id: workId,
                title: activity.activities?.activity_name || "ไม่มีชื่อชิ้นงาน",
                subtitle:
                  activity.course?.course_name_en ||
                  activity.course?.course_name_th ||
                  "",
                subjectId: activity.activities?.section_id,
                repositoryUrl: mapping.repository,
                isShowRepo: mapping.isShowRepo,
                roleAndResp: mapping.role_and_resp,
                isShowRole: mapping.isShowRole,
                initialExpectation: mapping.init_expect,
                isShowExpectation: mapping.isShowInit,
                reflection: mapping.reflection,
                isShowReflection: mapping.isShowReflec,
                feedback: activity.feedback,
                relatedSkillIds: [String(skill.id)],
                attachments: (
                  (attachmentsRes.data as Array<{
                    attachment_id: number;
                    original_filename: string;
                    file_type?: string;
                    url?: string;
                  }>) || []
                ).map((a) => ({
                  id: a.attachment_id.toString(),
                  fileName: a.original_filename,
                  fileType: a.file_type || "file",
                  url: a.url,
                })),
              });
            }
          }
        }

        const realWorks = Array.from(realWorksMap.values());

        console.log("Mapped real works:", realWorks);

        // Map fetched data to PortfolioData structure
        const mappedData: PortfolioData = {
          ...matchedConfig,
          selectedSkillIds: (matchedConfig.selectedSkillIds || []).map(
            (id: any) => id.toString(),
          ),
          personalInfo: mapPersonalInfo(userData, portfolioPersonalData, {
            firstName: "",
            lastName: "",
            fullName: "",
            profileImageUrl: "",
          }),
          education: educationData
            .filter((e) => e.is_show)
            .map((e) => ({
              id: e.id.toString(),
              startDate: formatBuddhistYear(e.start_year),
              endDate: formatBuddhistYear(e.end_year),
              degree: mapEducationLevel(e.education_level, e.study_plan),
              institution: e.institution || "",
              field:
                e.education_level === "HIGH_SCHOOL" ||
                e.education_level === "มัธยมปลาย"
                  ? e.study_plan
                    ? "แผนการเรียน " + e.study_plan
                    : ""
                  : [
                      e.faculty ? "คณะ" + e.faculty : "",
                      e.major ? "สาขา" + e.major : "",
                    ]
                      .filter(Boolean)
                      .join(" "),
            })),
          works: realWorks,
          skills: skillsData.map((s) => ({
            id: s.id.toString(),
            name: s.name || "",
          })),
          trainings: trainingData
            .filter((t) => t.is_show)
            .map((t) => ({
              id: t.id.toString(),
              year: t.year?.toString() || "",
              organize: t.organize || "",
              name: t.name || "",
              description: t.description || "",
              country: t.country || "",
              attachments: t.attachments.map((a: any) => {
                const ext = a.original_filename
                  ?.split(".")
                  .pop()
                  ?.toLowerCase();
                const isImg = [
                  "jpg",
                  "jpeg",
                  "png",
                  "gif",
                  "webp",
                  "svg",
                  "svg+xml",
                ].includes(ext || "");
                return {
                  id: a.attachment_id.toString(),
                  fileName: a.original_filename || "",
                  fileType: isImg ? "image" : "file",
                  url: a.url
                    ? a.url.startsWith("http")
                      ? a.url
                      : getFile(a.url)
                    : undefined,
                };
              }),
            })),
          certificates: certificateData
            .filter((c) => c.is_show)
            .map((c) => ({
              id: c.id.toString(),
              name: c.name || "",
              organizer: c.organize || "",
              date: c.date
                ? new Date(c.date).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "",
              description: c.description || "",
              attachments: c.attachments.map((a: any) => {
                const ext = a.original_filename
                  ?.split(".")
                  .pop()
                  ?.toLowerCase();
                const isImg = [
                  "jpg",
                  "jpeg",
                  "png",
                  "gif",
                  "webp",
                  "svg",
                  "svg+xml",
                ].includes(ext || "");
                return {
                  id: a.attachment_id.toString(),
                  fileName: a.original_filename || "",
                  fileType: isImg ? "image" : "file",
                  url: a.url
                    ? a.url.startsWith("http")
                      ? a.url
                      : getFile(a.url)
                    : undefined,
                };
              }),
            })),
          experiences: internshipData.map((i) => ({
            id: i.id.toString(),
            title: i.title || "",
            year: i.start_date
              ? new Date(i.start_date).getFullYear().toString()
              : "",
            company: i.company || "",
            location: i.province || "",
            type: (i.type?.toLowerCase() as "intern" | "coop") || "intern",
            country: i.country || "",
            province: i.province || "",
            startDate: i.start_date
              ? new Date(i.start_date).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "",
            endDate: i.end_date
              ? new Date(i.end_date).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "",
            position: i.position || "",
            resp: i.resp || "",
            isShowResp: i.is_show_resp ?? true,
            learningOutcome: i.learning_out || "",
            isShowLearning: i.is_show_learning ?? true,
            reflection: i.reflection || "",
            isShowReflection: i.is_show_reflec ?? true,
            attachments: i.attachments.map((a: any) => {
              const ext = a.original_filename?.split(".").pop()?.toLowerCase();
              const isImg = [
                "jpg",
                "jpeg",
                "png",
                "gif",
                "webp",
                "svg",
                "svg+xml",
              ].includes(ext || "");
              return {
                id: a.attachment_id.toString(),
                fileName: a.original_filename || "",
                fileType: isImg ? "image" : "file",
                url: a.url
                  ? a.url.startsWith("http")
                    ? a.url
                    : getFile(a.url)
                  : undefined,
              };
            }),
          })),
          awards: awardData
            .filter((a) => a.is_show)
            .map((a) => ({
              id: a.id.toString(),
              name: a.name || "",
              organizer: a.organize || "",
              award: a.award || "",
              date: a.date
                ? new Date(a.date).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "",
              isShow: a.is_show ?? true,
              attachments: a.attachments.map((att: any) => {
                const ext = att.original_filename
                  ?.split(".")
                  .pop()
                  ?.toLowerCase();
                const isImg = [
                  "jpg",
                  "jpeg",
                  "png",
                  "gif",
                  "webp",
                  "svg",
                  "svg+xml",
                ].includes(ext || "");
                return {
                  id: att.attachment_id.toString(),
                  fileName: att.original_filename || "",
                  fileType: isImg ? "image" : "file",
                  url: att.url
                    ? att.url.startsWith("http")
                      ? att.url
                      : getFile(att.url)
                    : undefined,
                };
              }),
            })),
          activities: activityData
            .filter((a) => a.is_show)
            .map((a) => ({
              id: a.id.toString(),
              year: a.date
                ? (new Date(a.date).getFullYear() + 543).toString()
                : "-",
              title: a.name || "",
              role: a.role || "",
              date: a.date
                ? new Date(a.date).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : undefined,
              attachments: (a.attachments || []).map((att: any) => {
                const ext = att.original_filename
                  ?.split(".")
                  .pop()
                  ?.toLowerCase();
                const isImg = [
                  "jpg",
                  "jpeg",
                  "png",
                  "gif",
                  "webp",
                  "svg",
                  "svg+xml",
                ].includes(ext || "");
                return {
                  id: att.attachment_id.toString(),
                  fileName: att.original_filename || "",
                  fileType: isImg ? "image" : "file",
                  url: att.url
                    ? att.url.startsWith("http")
                      ? att.url
                      : getFile(att.url)
                    : undefined,
                };
              }),
            })),
          projects: thesisData.map((t) => ({
            id: t.id.toString(),
            title: t.name || "",
            tag: "โครงงานปริญญาตรี",
            description: t.role_and_resp || "",
            repositoryUrl: t.repository || "",
            roleAndResp: t.role_and_resp || "",
            isShowRole: t.is_show_role ?? true,
            initialExpectation: t.init_expect || "",
            isShowInitialExpectation: t.is_show_init ?? true,
            reflection: t.reflection || "",
            isShowReflection: t.is_show_reflec ?? true,
            attachments: (t.attachments || []).map((a: any) => {
              const ext = a.original_filename?.split(".").pop()?.toLowerCase();
              const isImg = [
                "jpg",
                "jpeg",
                "png",
                "gif",
                "webp",
                "svg",
                "svg+xml",
              ].includes(ext || "");
              return {
                id: a.attachment_id.toString(),
                fileName: a.original_filename || "",
                fileType: isImg ? "image" : "file",
                url: a.url
                  ? a.url.startsWith("http")
                    ? a.url
                    : getFile(a.url)
                  : undefined,
              };
            }),
          })),
        };

        setData(mappedData);
      } catch (err) {
        console.error("Error fetching portfolio data:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));


      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [id, homeSlice.studentId]);

  return { data, loading, error };
};
