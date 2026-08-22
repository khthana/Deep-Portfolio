import { useState, useEffect } from "react";
import type { PublicPortfolioDetail } from "@deep-portfolio/api-types";
import { getFile } from "../../../../utils/get-file";
import { cleanNullStr } from "../../../../utils/clean-null-str";
import type { ResponseWrapper } from "../../../../types/global-type";
import type { PortfolioData } from "../components/e-portfolio-template/types";
import { axiosInstance } from "../../../../lib/axios";
import {
  mapPersonalInfo,
  formatBuddhistYear,
  mapEducationLevel,
} from "./portfolio-mapper";

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

        // The one route in the group with no session behind it: the token in
        // the URL is the credential (ADR-0001), so this is the only fetch here
        // that does not go through a service in src/services.
        const resp = await axiosInstance.get<
          ResponseWrapper<PublicPortfolioDetail>
        >(`/portfolio/public/${token}`);
        if (!resp.data.success)
          throw new Error(resp.data.message || "Failed to fetch portfolio");

        // The same cleanNullStr src/utils has, which this file used to carry a
        // second copy of, character for character (#68).
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
          selectedSkillIds: matchedConfig.selectedSkillIds.map((id) =>
            id.toString(),
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
          works: realWorks.map((w) => {
            const relatedSkillIds = w.relatedSkillIds.map((id) =>
              id.toString(),
            );
            return {
              ...w,
              id: w.id.toString(),
              relatedSkillIds,
              relatedSkills: relatedSkillIds.map((id: string) => {
                const s = skillsData.find((sk) => sk.id.toString() === id);
                return { id, name: s?.name || "ทักษะ" };
              }),
              // The extension comes off fileName. It used to be read off
              // original_filename, which this endpoint has never sent — the
              // key is fileName here, where the section endpoints call it
              // original_filename — so ext was undefined and isImg was always
              // false. What reads this is the work detail page on the shared
              // route, /p/:shareToken/work/:workId, which splits attachments
              // into an image gallery and a file list: every image landed in
              // the file list (#68, and BEHAVIOR-CHANGES.md).
              attachments: w.attachments.map((a) => {
                const ext = a.fileName.split(".").pop()?.toLowerCase();
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
                  fileType: isImg ? "image" : ext === "pdf" ? "pdf" : "file",
                  url: a.url.startsWith("http") ? a.url : getFile(a.url),
                };
              }),
            };
          }),
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
              attachments: t.attachments.map((a) => {
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
              attachments: c.attachments.map((a) => {
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
            attachments: i.attachments.map((a) => {
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
              attachments: a.attachments.map((att) => {
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
          activities: activityData
            .filter((a) => a.is_show)
            .map((a) => ({
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
              attachments: a.attachments.map((att) => {
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
            attachments: t.attachments.map((a) => {
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
        // No message of its own for the thing that was not an error: the page
        // owns the Thai sentence for a portfolio that would not load, and an
        // English placeholder put here would be rendered in its place (#51).
        setError(err instanceof Error ? err : new Error(""));
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [token]);

  return { data, loading, error };
};
