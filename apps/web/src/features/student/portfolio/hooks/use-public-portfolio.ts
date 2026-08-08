import { useState, useEffect } from "react";
import { getFile } from "../../../../utils/get-file";
import type {
  PortfolioData,
  Work,
} from "../components/e-portfolio-template/types";
import { axiosInstance } from "../../../../lib/axios";
import { endpoints } from "../../../../configs/endpoints.config";
import { mapPersonalInfo, formatBuddhistYear, mapEducationLevel } from "./portfolio-mapper";

export interface UsePublicPortfolioResult {
  data: PortfolioData | null;
  loading: boolean;
  error: Error | null;
}

export const usePublicPortfolio = (
  token: string,
  skip: boolean = false,
): UsePublicPortfolioResult => {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (skip) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        if (!token) {
          setLoading(false);
          return;
        }

        // Use custom endpoint for public portfolio
        const resp = await axiosInstance.get(`/portfolio/public/${token}`);
        if (!resp.data.success)
          throw new Error(resp.data.message || "Failed to fetch portfolio");

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

        const cleanedData = cleanNullStr(resp.data.data);

        const {
          portfolioConfig: matchedConfig,
          userData,
          portfolioPersonalData,
          educationData,
          trainingData,
          certificateData,
          internshipData,
          awardData,
          activityData,
          skillsData,
          thesisData,
          realWorks,
        } = cleanedData;

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
          education: (educationData || [])
            .filter((e: any) => e.is_show)
            .map((e: any) => ({
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
          works: (realWorks || []).map((w: any) => {
            const relatedSkillIds = (w.relatedSkillIds || []).map((id: any) =>
              id.toString(),
            );
            return {
              ...w,
              id: w.id.toString(),
              relatedSkillIds,
              relatedSkills: relatedSkillIds.map((id: string) => {
                const s = (skillsData || []).find(
                  (sk: any) => sk.id.toString() === id,
                );
                return { id, name: s?.name || "ทักษะ" };
              }),
              attachments: (w.attachments || []).map((a: any) => {
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
                  ...a,
                  id: a.attachment_id?.toString() || a.id?.toString() || "",
                  fileType: isImg ? "image" : ext === "pdf" ? "pdf" : "file",
                  url: a.url
                    ? a.url.startsWith("http")
                      ? a.url
                      : getFile(a.url)
                    : undefined,
                };
              }),
            };
          }),
          skills: (skillsData || []).map((s: any) => ({
            id: s.id.toString(),
            name: s.name || "",
          })),
          trainings: (trainingData || [])
            .filter((t: any) => t.is_show)
            .map((t: any) => ({
              id: t.id.toString(),
              year: t.year?.toString() || "",
              organize: t.organize || "",
              name: t.name || "",
              description: t.description || "",
              country: t.country || "",
              attachments: (t.attachments || []).map((a: any) => {
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
                  id: a.attachment_id?.toString() || "",
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
          certificates: (certificateData || [])
            .filter((c: any) => c.is_show)
            .map((c: any) => ({
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
              attachments: (c.attachments || []).map((a: any) => {
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
                  id: a.attachment_id?.toString() || "",
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
          experiences: (internshipData || []).map((i: any) => ({
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
            attachments: (i.attachments || []).map((a: any) => {
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
                id: a.attachment_id?.toString() || "",
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
          awards: (awardData || [])
            .filter((a: any) => a.is_show)
            .map((a: any) => ({
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
                  id: att.attachment_id?.toString() || "",
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
          activities: (activityData || [])
            .filter((a: any) => a.is_show)
            .map((a: any) => ({
              id: a.id.toString(),
              year: a.date
                ? (new Date(a.date).getFullYear() + 543).toString()
                : "-",
              title: a.name || "",
              role: a.role || "",
              description: a.description || "",
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
                  id: att.attachment_id?.toString() || "",
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
          projects: (thesisData || []).map((t: any) => ({
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
                id: a.attachment_id?.toString() || "",
                fileName: a.original_filename || "",
                fileType: isImg ? "image" : ext || "file",
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
        console.error("Error fetching public portfolio data:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [token]);

  return { data, loading, error };
};
