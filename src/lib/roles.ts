export type DeskRole = "admin" | "tong-bt" | "btv" | "phong-vien";

export const ROLE_LABEL: Record<DeskRole, string> = {
  admin: "Admin",
  "tong-bt": "Tổng biên tập",
  btv: "Biên tập viên",
  "phong-vien": "Phóng viên",
};

export function asRole(value: string | null | undefined): DeskRole {
  if (value === "admin" || value === "tong-bt" || value === "phong-vien" || value === "btv") return value;
  if (value === "editor") return "btv";
  return "btv";
}

export function isChief(role: DeskRole) {
  return role === "admin" || role === "tong-bt";
}

export function canPublish(role: DeskRole) {
  return role !== "phong-vien";
}

export const STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  review: "Chờ duyệt",
  scheduled: "Hẹn giờ",
  published: "Đã xuất bản",
};
