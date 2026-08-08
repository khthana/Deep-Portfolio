export interface PortfolioInternshipReqBody {
  user_id: string; // From query or body, strictly required for creation
  type: "INTERN" | "COOP";
  title?: string | null; // Optional (used for COOP)
  position: string; // Required (renamed from job_desc)
  company: string;
  country: string; // Required (New field)
  province?: string;
  start_date?: string | Date; // string from FormData
  end_date?: string | Date; // string from FormData
  resp?: string;
  is_show_resp?: boolean;
  learning_out?: string;
  is_show_learning?: boolean;
  reflection?: string;
  is_show_reflec?: boolean;

  // For updates
  ids_to_delete?: number[] | number;
}

export interface PortfolioInternshipResp {
  id: number;
  user_id: string;
  type: string;
  title: string | null;
  position: string | null;
  company: string | null;
  country: string | null;
  province: string | null;
  start_date: Date | null;
  end_date: Date | null;
  resp: string | null;
  is_show_resp: boolean | null;
  learning_out: string | null;
  is_show_learning: boolean | null;
  reflection: string | null;
  is_show_reflec: boolean | null;
  attachments: any[];
}
