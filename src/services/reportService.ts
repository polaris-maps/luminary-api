import { Filter } from "bad-words";
import { query } from "../db/client";
import { AppReport, NewReport, ReportRow } from "../schemas/reportSchema";

const filter = new Filter();

export async function getOpenReports() {
  const rows: ReportRow[] = await query(
    "SELECT * FROM report WHERE status = ? AND deleted_at IS NULL ORDER BY opened_at DESC, id DESC",
    ["Open"],
  );

  if (!rows.every(isWholeNumberRow)) {
    return [];
  }

  return rows.map(toAppReport);
}

export async function addReport(report: NewReport) {
  const rows: ReportRow[] = await query(
    "INSERT INTO report (location, latitude, longitude, description, opened_at, image, categories, qna) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
    [
      censor(report.location),
      report.latitude,
      report.longitude,
      censor(report.description),
      Date.now(),
      report.image || null,
      JSON.stringify(report.category ?? []),
      censor(report.qna),
    ],
  );
  return toAppReport(rows[0]);
}

function censor(text: string | null | undefined) {
  return text ? filter.clean(text) : (text ?? null);
}

function isWholeNumberRow(row: ReportRow): boolean {
  return Number.isInteger(row.id) && Number.isInteger(row.votes) && Number.isInteger(row.opened_at);
}

function toAppReport(row: ReportRow): AppReport {
  return {
    issue_id: row.id,
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    description: row.description,
    datetimeopen: row.opened_at,
    votes: row.votes,
    image: row.image,
    category: JSON.parse(row.categories),
    qna: row.qna,
  };
}
