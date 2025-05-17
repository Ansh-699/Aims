import axios from "axios";

const BASE = "https://abes.platform.simplifii.com/api/v1";

export async function fetchStudentRecords(token: string) {
  const url = `${BASE}/custom/getCFMappedWithStudentID?embed_attendance_summary=1`;
  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const records = data?.response?.data;
  if (!Array.isArray(records)) {
    throw new Error("Unexpected API structure");
  }
  return records;
}
