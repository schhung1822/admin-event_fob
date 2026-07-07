import type { RowDataPacket } from "mysql2";

import { Badge } from "@/components/ui/badge";
import { getDatabasePool } from "@/lib/db";

import { OrdersTable } from "./_components/orders-table";
import type { OrderRow } from "./_components/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type OrderDbRow = RowDataPacket & OrderRow;

async function getOrders() {
  const [rows] = await getDatabasePool().query<OrderDbRow[]>(`
    SELECT
      id,
      COALESCE(order_id, '') AS order_id,
      COALESCE(ordercode, '') AS ordercode,
      COALESCE(DATE_FORMAT(create_time, '%Y-%m-%d %H:%i:%s'), '') AS create_time,
      COALESCE(DATE_FORMAT(update_time, '%Y-%m-%d %H:%i:%s'), '') AS payment_time,
      COALESCE(DATE_FORMAT(checkin_time, '%Y-%m-%d %H:%i:%s'), '') AS checkin_time,
      COALESCE(name, '') AS name,
      COALESCE(phone, '') AS phone,
      COALESCE(email, '') AS email,
      COALESCE(gender, '') AS gender,
      COALESCE(class, '') AS class,
      COALESCE(money, 0) AS money,
      COALESCE(status, '') AS status,
      COALESCE(is_gift, 0) AS is_gift,
      COALESCE(is_checkin, 0) AS is_checkin,
      COALESCE(number_checkin, 0) AS number_checkin,
      COALESCE(career, '') AS career,
      COALESCE(brand, '') AS brand,
      COALESCE(source, '') AS source,
      COALESCE(ref, '') AS ref,
      COALESCE(voucher, '') AS voucher,
      COALESCE(utm_source, '') AS utm_source,
      COALESCE(utm_medium, '') AS utm_medium,
      COALESCE(utm_campaign, '') AS utm_campaign,
      step_mail,
      step_zbs
    FROM orders
    ORDER BY id DESC
    LIMIT 500
  `);

  return rows.map((row) => ({
    ...row,
    id: Number(row.id),
    is_checkin: Number(row.is_checkin),
    is_gift: Number(row.is_gift),
    money: Number(row.money),
    number_checkin: Number(row.number_checkin),
    step_mail: row.step_mail === null ? null : Number(row.step_mail),
    step_zbs: row.step_zbs === null ? null : Number(row.step_zbs),
  }));
}

export default async function Page() {
  const orders = await getOrders();
  const paidOrders = orders.filter((order) => order.status === "paydone" || order.status === "paid");
  const paidCount = paidOrders.length;
  const checkedInCount = orders.filter((order) => order.is_checkin).length;
  const revenue = paidOrders.reduce((sum, order) => sum + order.money, 0);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <div className="rounded-lg border p-4">
          <div className="text-muted-foreground text-sm">Vé đăng ký</div>
          <div className="mt-2 font-heading font-semibold text-2xl">{orders.length}</div>
          <Badge variant="outline" className="mt-3">
            Hiển thị tối đa 500 dòng
          </Badge>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-muted-foreground text-sm">Đã thanh toán</div>
          <div className="mt-2 font-heading font-semibold text-2xl">{paidCount}</div>
          <Badge variant="outline" className="mt-3">
            Theo trạng thái paydone
          </Badge>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-muted-foreground text-sm">Doanh thu bán vé</div>
          <div className="mt-2 font-heading font-semibold text-2xl">
            {new Intl.NumberFormat("vi-VN", {
              currency: "VND",
              maximumFractionDigits: 0,
              style: "currency",
            }).format(revenue)}
          </div>
          <Badge variant="outline" className="mt-3">
            {checkedInCount} vé đã check-in
          </Badge>
        </div>
      </div>
      <div className="px-4 lg:px-6">
        <OrdersTable data={orders} />
      </div>
    </div>
  );
}
