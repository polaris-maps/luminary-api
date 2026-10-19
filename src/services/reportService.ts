import { query } from "../db/client";
import { AppReport, ReportRow } from "../schemas/reportSchema";

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

function isWholeNumberRow(row: ReportRow): boolean {
  return (
    Number.isInteger(row.id) &&
    Number.isInteger(row.votes) &&
    Number.isInteger(row.opened_at)
  );
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
