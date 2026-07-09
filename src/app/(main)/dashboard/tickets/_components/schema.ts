export type TicketRow = {
  id: number;
  ticket_id: string;
  name: string;
  money: number;
  money_sale: number | null;
  nc_order: number | null;
  time_start: string;
  time_end: string;
  status: "active" | "sold_out" | string;
  created_at: string;
  updated_at: string;
};

export type TicketFormMode = "create" | "edit";
