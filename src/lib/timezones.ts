/**
 * IANA timezone options for the tenant settings dropdown. The list is shared
 * between the client dropdown and the server-side zod schema (which validates
 * the chosen value with `isValidTimeZone`, so any value a user picks is always
 * a real IANA timezone — the default is Asia/Ho_Chi_Minh per the plan).
 */
export const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "Asia/Ho_Chi_Minh", label: "Việt Nam (Asia/Ho_Chi_Minh)" },
  { value: "Asia/Bangkok", label: "Thái Lan (Asia/Bangkok)" },
  { value: "Asia/Jakarta", label: "Indonesia (Asia/Jakarta)" },
  { value: "Asia/Singapore", label: "Singapore (Asia/Singapore)" },
  { value: "Asia/Kuala_Lumpur", label: "Malaysia (Asia/Kuala_Lumpur)" },
  { value: "Asia/Manila", label: "Philippines (Asia/Manila)" },
  { value: "Asia/Seoul", label: "Hàn Quốc (Asia/Seoul)" },
  { value: "Asia/Tokyo", label: "Nhật Bản (Asia/Tokyo)" },
  { value: "Asia/Shanghai", label: "Trung Quốc (Asia/Shanghai)" },
  { value: "Asia/Taipei", label: "Đài Loan (Asia/Taipei)" },
  { value: "Asia/Hong_Kong", label: "Hồng Kông (Asia/Hong_Kong)" },
  { value: "Asia/Dubai", label: "UAE (Asia/Dubai)" },
  { value: "Europe/Paris", label: "Pháp (Europe/Paris)" },
  { value: "Europe/London", label: "Anh (Europe/London)" },
  { value: "America/New_York", label: "Hoa Kỳ — Đông (America/New_York)" },
  { value: "America/Los_Angeles", label: "Hoa Kỳ — Tây (America/Los_Angeles)" },
  { value: "Australia/Sydney", label: "Úc — Đông (Australia/Sydney)" },
  { value: "Australia/Perth", label: "Úc — Tây (Australia/Perth)" },
  { value: "Pacific/Auckland", label: "New Zealand (Pacific/Auckland)" },
];

/** True when the value is a valid IANA timezone recognized by the platform. */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}
