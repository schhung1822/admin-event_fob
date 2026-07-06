export type UserRow = {
  id: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  ncOrder: string;
  customerId: string;
  name: string;
  gender: string;
  phone: string;
  email: string;
  career: string;
  brand: string;
  userIp: string;
  userAgent: string;
  fbp: string;
  fbc: string;
  ttclid: string;
  ttp: string;
  createTime: string;
  paidTicketCount: number;
  paidSpend: number;
};

export const emptyFilterValue = "All";

export const genderLabels: Record<string, string> = {
  f: "N\u1eef",
  female: "N\u1eef",
  m: "Nam",
  male: "Nam",
  other: "Kh\u00e1c",
};

export function getGenderLabel(gender: string) {
  const normalizedGender = gender.trim().toLowerCase();
  return genderLabels[normalizedGender] ?? (gender || "-");
}

export function createFilterOptions(users: UserRow[], key: keyof Pick<UserRow, "brand" | "career" | "gender">) {
  const values = users
    .map((user) => user[key].trim())
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .sort((first, second) => first.localeCompare(second, "vi"));

  return [emptyFilterValue, ...values];
}