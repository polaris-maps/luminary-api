import { z } from "zod";

export type ReportRow = {
  id: number;
  location: string | null;
  latitude: number;
  longitude: number;
  description: string | null;
  status: string;
  opened_at: number;
  closed_at: number | null;
  is_permanent: number;
  votes: number;
  image: string | null;
  categories: string;
  qna: string | null;
  device_id: string | null;
  last_confirmed_at: number | null;
  deleted_at: number | null;
};

export type AppReport = {
  issue_id: number;
  location: string | null;
  latitude: number;
  longitude: number;
  description: string | null;
  datetimeopen: number;
  votes: number;
  image: string | null;
  category: string[];
  qna: string | null;
};

export const newReportSchema = z.object({
  location: z.string().nullish(),
  description: z.string().nullish(),
  latitude: z.number(),
  longitude: z.number(),
  datetimeOpen: z.number().nullish(),
  category: z.array(z.string()).nullish(),
  image: z.string().nullish(),
  qna: z.string().nullish(),
});

export type NewReport = z.infer<typeof newReportSchema>;
