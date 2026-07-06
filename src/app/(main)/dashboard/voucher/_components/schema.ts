export type VoucherClassy = "monet" | "rate" | "money";
export type VoucherTicketClass = "GOLD" | "RUBY" | "VIP";

export type VoucherRow = {
  id: number;
  voucher: string;
  classy: VoucherClassy | "";
  money: number | null;
  rate: number | null;
  number: number | null;
  ticketClass: VoucherTicketClass | "";
  fromDate: string;
  toDate: string;
  createdAt: string;
  updatedAt: string;
};

export type VoucherFormMode = "create" | "edit";