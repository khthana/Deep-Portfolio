import { axiosInstance } from "../lib/axios";
import { endpoints } from "../configs/endpoints.config";
import type { ResponseWrapper } from "../types/global-type";
import type {
  PortfolioDetail,
  PortfolioTemplateDetail,
} from "@deep-portfolio/api-types";
import type { PortfolioConfig } from "../features/student/portfolio/components/e-portfolio-template/types";

export interface CreatePortfolioReq {
  template_id: number;
  portfolio_name: string;
  template_color: string;
  about_me?: string;
  selectedSkillIds?: number[];
  isShowPersonal?: boolean;
  isShowEducation?: boolean;
  isShowTraining?: boolean;
  isShowCertificate?: boolean;
  isShowSkill?: boolean;
  isShowIntern?: boolean;
  isShowThesis?: boolean;
  isShowAward?: boolean;
  isShowActivity?: boolean;
}

/**
 * The wire shape, and the view model the templates read.
 *
 * These used to be one declaration: `PortfolioBackendResp` was written as
 * `PortfolioConfig` with two fields swapped out, which made the view model the
 * definition of the response and left everything it got wrong invisible. It
 * got five fields wrong that way — the template's id, name and colour, the
 * portfolio's name and its "about me" all arrive nullable and were all
 * declared non-null, the id as a `string` where the API sends a number — and a
 * sixth on its own account, `shareExpiresAt`, which is a `Date` nowhere but in
 * the API's process. Ten more were optional where the response always sends
 * them: the nine `isShowX` flags and the share token. `PortfolioDetail` is the response now (#68), and the
 * two are related by this function rather than by an `Omit`.
 *
 * All it converts is the skill ids: the templates carry them as strings
 * because every other id they hold is one. The four nullable fields are handed
 * over as they arrive, because each screen that reads one has a different
 * default for it — the edit form wants "Standard" where the preview page wants
 * ModernBlue — and coalescing here would take that choice away from all of
 * them (ADR-0043 §5).
 */
const mapBackendToFrontend = (p: PortfolioDetail): PortfolioConfig => ({
  ...p,
  selectedSkillIds: p.selectedSkillIds.map((id) => id.toString()),
});

export const getAllPortfolios = async (
  userId: string,
): Promise<ResponseWrapper<PortfolioConfig[]>> => {
  const resp = await axiosInstance.get<ResponseWrapper<PortfolioDetail[]>>(
    endpoints.portfolio.root,
    {
      params: { user_id: userId },
    },
  );
  if (resp.data.success) {
    return {
      ...resp.data,
      data: resp.data.data.map(mapBackendToFrontend),
    };
  }
  return resp.data as unknown as ResponseWrapper<PortfolioConfig[]>;
};

export const getPortfolioById = async (
  id: string,
): Promise<ResponseWrapper<PortfolioConfig>> => {
  const resp = await axiosInstance.get<ResponseWrapper<PortfolioDetail>>(
    endpoints.portfolio.detail(id as any),
  );
  if (resp.data.success) {
    return {
      ...resp.data,
      data: mapBackendToFrontend(resp.data.data),
    };
  }
  return resp.data as unknown as ResponseWrapper<PortfolioConfig>;
};

export const createPortfolio = async (
  data: CreatePortfolioReq,
): Promise<ResponseWrapper<PortfolioConfig>> => {
  const resp = await axiosInstance.post<ResponseWrapper<PortfolioDetail>>(
    endpoints.portfolio.root,
    data,
  );
  if (resp.data.success) {
    return {
      ...resp.data,
      data: mapBackendToFrontend(resp.data.data),
    };
  }
  return resp.data as unknown as ResponseWrapper<PortfolioConfig>;
};

export const updatePortfolio = async (
  id: string,
  data: Partial<CreatePortfolioReq>,
): Promise<ResponseWrapper<PortfolioConfig>> => {
  const resp = await axiosInstance.patch<ResponseWrapper<PortfolioDetail>>(
    endpoints.portfolio.detail(id as any),
    data,
  );
  if (resp.data.success) {
    return {
      ...resp.data,
      data: mapBackendToFrontend(resp.data.data),
    };
  }
  return resp.data as unknown as ResponseWrapper<PortfolioConfig>;
};

export const deletePortfolio = async (
  id: string,
): Promise<ResponseWrapper<null>> => {
  const resp = await axiosInstance.delete<ResponseWrapper<null>>(
    endpoints.portfolio.detail(id as any),
  );
  return resp.data;
};

/**
 * Mints a new share token, and forgets the one before it.
 *
 * Answers the whole portfolio rather than the token alone, which is why the
 * type here is the same `PortfolioDetail` the reads answer. It was untyped —
 * `response.data` with no argument at all — so the two callers reading
 * `.data.publicShareToken` off it were reading `any` (ADR-0042 §1).
 */
export const generateShareLink = async (
  id: string,
  expiresAt: string | null,
): Promise<ResponseWrapper<PortfolioDetail>> => {
  const response = await axiosInstance.post<ResponseWrapper<PortfolioDetail>>(
    `/portfolio/${id}/generate-share-link`,
    {
      expiresAt,
    },
  );
  return response.data;
};

export const getAllTemplates = async (): Promise<
  ResponseWrapper<PortfolioTemplateDetail[]>
> => {
  const resp = await axiosInstance.get<
    ResponseWrapper<PortfolioTemplateDetail[]>
  >(`${endpoints.portfolio.root}/templates`);
  return resp.data;
};
