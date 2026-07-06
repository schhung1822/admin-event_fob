import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type TicketClassStat = {
  ticketClass: string;
  registeredTickets: number;
  soldTickets: number;
  conversionRate: number;
  revenue: number;
  giftTickets: number;
  totalTickets: number;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value || 0);
}

function getTotalRow(data: TicketClassStat[]): TicketClassStat {
  const total = data.reduce(
    (summary, row) => ({
      ticketClass: "T\u1ed5ng c\u1ed9ng",
      registeredTickets: summary.registeredTickets + row.registeredTickets,
      soldTickets: summary.soldTickets + row.soldTickets,
      revenue: summary.revenue + row.revenue,
      giftTickets: summary.giftTickets + row.giftTickets,
      totalTickets: summary.totalTickets + row.totalTickets,
      conversionRate: 0,
    }),
    {
      ticketClass: "T\u1ed5ng c\u1ed9ng",
      registeredTickets: 0,
      soldTickets: 0,
      revenue: 0,
      giftTickets: 0,
      totalTickets: 0,
      conversionRate: 0,
    },
  );

  return {
    ...total,
    conversionRate: total.registeredTickets > 0 ? (total.soldTickets / total.registeredTickets) * 100 : 0,
  };
}

function ConversionCell({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="ml-auto grid w-36 gap-1.5">
      <div className="text-right font-medium tabular-nums">{value.toFixed(1)}%</div>
      <Progress value={safeValue} className="gap-0" aria-label={`Conversion ${value.toFixed(1)}%`} />
    </div>
  );
}

function StatRow({ isTotal = false, row }: { isTotal?: boolean; row: TicketClassStat }) {
  return (
    <TableRow className={isTotal ? "border-t bg-muted/40 font-medium hover:bg-muted/40" : "border-border/60 hover:bg-white/2.5"}>
      <TableCell className="py-4 font-medium">{row.ticketClass}</TableCell>
      <TableCell className="py-4 text-right tabular-nums">{formatNumber(row.registeredTickets)}</TableCell>
      <TableCell className="py-4 text-right tabular-nums">{formatNumber(row.soldTickets)}</TableCell>
      <TableCell className="py-4 text-right tabular-nums">
        <ConversionCell value={row.conversionRate} />
      </TableCell>
      <TableCell className="py-4 text-right font-medium tabular-nums">{formatMoney(row.revenue)}</TableCell>
      <TableCell className="py-4 text-right tabular-nums">{formatNumber(row.giftTickets)}</TableCell>
      <TableCell className="py-4 text-right tabular-nums">{formatNumber(row.totalTickets)}</TableCell>
    </TableRow>
  );
}

export function TicketClassStatsTable({ data }: { data: TicketClassStat[] }) {
  const totalRow = getTotalRow(data);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="leading-none">{"Th\u1ed1ng k\u00ea theo h\u1ea1ng v\u00e9"}</CardTitle>
        <CardDescription>
          {"Th\u1ed1ng k\u00ea t\u1ea5t c\u1ea3 v\u00e9 theo h\u1ea1ng, bao g\u1ed3m v\u00e9 mua, v\u00e9 b\u00e1n ra v\u00e0 v\u00e9 t\u1eb7ng."}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
          <TableHeader>
            <TableRow>
              <TableHead className="py-4">{"H\u1ea1ng v\u00e9"}</TableHead>
              <TableHead className="py-4 text-right">{"V\u00e9 \u0111\u0103ng k\u00fd"}</TableHead>
              <TableHead className="py-4 text-right">{"V\u00e9 b\u00e1n ra"}</TableHead>
              <TableHead className="py-4 text-right">{"T\u1ef7 l\u1ec7 chuy\u1ec3n \u0111\u1ed5i"}</TableHead>
              <TableHead className="py-4 text-right">{"Doanh s\u1ed1"}</TableHead>
              <TableHead className="py-4 text-right">{"V\u00e9 t\u1eb7ng"}</TableHead>
              <TableHead className="py-4 text-right">{"T\u1ed5ng v\u00e9"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length ? (
              <>
                {data.map((row) => (
                  <StatRow key={row.ticketClass} row={row} />
                ))}
                <StatRow row={totalRow} isTotal />
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {"Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u h\u1ea1ng v\u00e9."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}