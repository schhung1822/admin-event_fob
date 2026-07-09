import Link from "next/link";

import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  Gift,
  LayoutDashboard,
  ListChecks,
  Settings,
  ShoppingBag,
  Ticket,
  Users,
} from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Tài liệu CRM | Event FOB",
  description: "Hướng dẫn sử dụng CRM Event FOB cho quản trị viên và nhân sự vận hành sự kiện.",
};

type GuideSection = {
  id: string;
  title: string;
  description: string;
  icon: typeof LayoutDashboard;
  steps: string[];
  notes?: string[];
};

const guideSections: GuideSection[] = [
  {
    id: "overview",
    title: "Tổng quan dashboard",
    description: "Theo dõi nhanh số vé đăng ký, vé đã thanh toán, doanh thu và hiệu quả bán vé theo từng hạng.",
    icon: LayoutDashboard,
    steps: [
      "Mở Dashboard > Tổng quan để xem chỉ số vận hành chính.",
      "Dùng biểu đồ hiệu suất để kiểm tra lượng đăng ký, thanh toán và doanh thu theo ngày.",
      "Xem bảng hạng vé để nắm số lượng đã đăng ký, đã bán, vé tặng và doanh thu từng hạng.",
    ],
    notes: ["Chỉ số doanh thu chỉ tính các đơn có trạng thái paydone."],
  },
  {
    id: "orders",
    title: "Quản lý đơn hàng",
    description: "Tạo vé, chỉnh thông tin khách, cập nhật thanh toán, xuất danh sách và xử lý check-in.",
    icon: ShoppingBag,
    steps: [
      "Mở Dashboard > Đơn hàng hoặc bấm nút Thêm vé ở sidebar.",
      "Nhập thông tin khách hàng, hạng vé, số lượng, số tiền và trạng thái thanh toán.",
      "Dùng tìm kiếm để lọc theo tên, số điện thoại, email, mã đơn hoặc mã vé.",
      "Dùng menu từng dòng để chỉnh sửa, xóa hoặc cập nhật thông tin cần thiết.",
      "Bấm Xuất CSV/XLS khi cần gửi danh sách cho đội vận hành.",
    ],
    notes: [
      "Một lần tạo nhiều vé dùng chung order_id, mỗi vé vẫn có ordercode riêng.",
      "Đơn thanh toán thành công nên dùng trạng thái paydone để đồng bộ báo cáo.",
    ],
  },
  {
    id: "tickets",
    title: "Cấu hình hạng vé",
    description: "Quản lý các gói vé, giá bán, thứ tự hiển thị và trạng thái bán trên website.",
    icon: Ticket,
    steps: [
      "Mở Dashboard > Hạng vé để xem danh sách các hạng vé đang cấu hình.",
      "Thêm hoặc sửa tên vé, mã hạng vé, giá, số lượng và thứ tự hiển thị.",
      "Tắt hạng vé khi không muốn bán tiếp nhưng vẫn cần giữ dữ liệu cũ.",
      "Kiểm tra lại website sự kiện sau khi thay đổi hạng vé.",
    ],
  },
  {
    id: "voucher",
    title: "Voucher và ưu đãi",
    description: "Tạo mã giảm giá, giới hạn lượt dùng và kiểm soát hiệu lực voucher.",
    icon: Gift,
    steps: [
      "Mở Dashboard > Voucher để quản lý danh sách mã giảm giá.",
      "Tạo mã mới với loại giảm giá, giá trị giảm và số lượt được dùng.",
      "Theo dõi số lượt đã dùng để tránh vượt ngân sách ưu đãi.",
      "Tắt voucher khi chương trình kết thúc hoặc mã không còn hợp lệ.",
    ],
    notes: ["Hiện chưa có chức năng áp dụng voucher trên website bán vé. Nên mục này tạm thời bỏ qua"],
  },
  {
    id: "customers",
    title: "Khách hàng",
    description: "Tra cứu người mua vé và kiểm tra lịch sử đơn theo thông tin liên hệ.",
    icon: Users,
    steps: [
      "Mở Dashboard > Khách hàng để xem danh sách khách đã phát sinh đơn.",
      "Tìm theo tên, số điện thoại hoặc email khi cần hỗ trợ khách.",
      "Đối chiếu số lượng vé, trạng thái thanh toán và thông tin check-in trước khi phản hồi.",
    ],
  },
  {
    id: "crm-report",
    title: "Báo cáo CRM",
    description: "Xem phễu vận hành, hoạt động đơn hàng, check-in và các chỉ số theo sự kiện.",
    icon: BarChart3,
    steps: [
      "Mở Dashboard > CRM để xem báo cáo chuyên sâu.",
      "Dùng các bảng và biểu đồ để đánh giá doanh thu, vé tặng, số lượt check-in và tỷ lệ chuyển đổi.",
      "Kiểm tra nhóm dữ liệu bất thường trước khi xuất báo cáo cuối ngày.",
    ],
  },
  {
    id: "account",
    title: "Tài khoản và giao diện",
    description: "Quản lý tài khoản đăng nhập, đổi giao diện và điều chỉnh cách hiển thị dashboard.",
    icon: Settings,
    steps: [
      "Mở Dashboard > Tài khoản để xem thông tin người dùng đang đăng nhập.",
      "Dùng nút giao diện trên thanh trên cùng để đổi theme, font, layout hoặc kiểu sidebar.",
      "Đăng xuất khỏi CRM khi dùng máy chung hoặc bàn giao ca trực.",
    ],
  },
];

const statusItems = [
  {
    label: "new: Mới",
    description: "Đơn hàng mới được tạo và đang trong thời gian có thể thanh toán",
  },
  {
    label: "paydone: Đã thanh toán",
    description: "Đơn đã thanh toán thành công và được tính vào doanh thu.",
  },
  {
    label: "expired: Hết hạn",
    description: "Đơn hàng quá thời gian thanh toán trong 15p khi đăng ký vé",
  },
  {
    label: "Loại vé",
    description: "Vé mua với chấm tròn màu xanh dương. Vé tặng với chấm tròn màu vàng",
  },
];

const recommendedFlow = [
  "Cấu hình hạng vé trước khi mở bán.",
  "Tạo voucher nếu có chương trình ưu đãi.",
  "Theo dõi đơn hàng mới mỗi ngày và cập nhật trạng thái thanh toán.",
  "Xuất danh sách vé trước sự kiện để đối soát với đội check-in.",
  "Trong ngày diễn ra sự kiện, ưu tiên tìm kiếm theo số điện thoại hoặc mã vé.",
  "Sau sự kiện, dùng Dashboard và CRM để tổng hợp doanh thu, số vé bán và số lượt check-in.",
];

function SectionCard({ section }: { readonly section: GuideSection }) {
  const Icon = section.icon;

  return (
    <section
      id={section.id}
      className="scroll-mt-[calc(var(--dashboard-header-height)+10rem)] rounded-lg border bg-card p-5 text-card-foreground shadow-xs lg:scroll-mt-[calc(var(--dashboard-header-height)+1rem)]"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-lg">{section.title}</h2>
          <p className="mt-1 text-muted-foreground text-sm">{section.description}</p>
        </div>
      </div>
      <ol className="mt-4 space-y-2 text-sm">
        {section.steps.map((step) => (
          <li key={step} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {section.notes?.length ? (
        <div className="mt-4 rounded-md border bg-muted/40 p-3">
          <p className="font-medium text-sm">Lưu ý</p>
          <ul className="mt-2 space-y-1 text-muted-foreground text-sm">
            {section.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export default function DocumentPage() {
  return (
    <div className="@container/main mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="rounded-lg border bg-background p-5 shadow-xs md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-3">
              <BookOpen className="size-3.5" />
              Tài liệu sử dụng CRM
            </Badge>
            <h1 className="font-heading font-semibold text-2xl md:text-3xl">
              Hướng dẫn vận hành Admin Event Future Of Busines
            </h1>
          </div>
          <Button variant="outline" render={<Link href="/dashboard/default" prefetch={false} />}>
            <ArrowLeft />
            Về dashboard
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-background p-4">
          <BadgeCheck className="mb-3 size-5 text-primary" />
          <h2 className="font-semibold">Dữ liệu tập trung</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Đơn hàng, khách hàng, hạng vé và voucher được quản lý trong một khu vực.
          </p>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <CircleDollarSign className="mb-3 size-5 text-primary" />
          <h2 className="font-semibold">Báo cáo doanh thu</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Doanh thu và tỷ lệ chuyển đổi dựa trên các đơn đã chuyển sang paydone.
          </p>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <ListChecks className="mb-3 size-5 text-primary" />
          <h2 className="font-semibold">Hỗ trợ vận hành</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Tìm kiếm, xuất file và đối soát giúp đội sự kiện xử lý nhanh trước và trong ngày diễn ra.
          </p>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="sticky top-[var(--dashboard-header-height)] z-20 max-h-[calc(100svh-var(--dashboard-header-height)-1rem)] self-start overflow-y-auto rounded-lg border bg-background/95 p-4 shadow-xs backdrop-blur lg:top-[calc(var(--dashboard-header-height)+1rem)] lg:max-h-[calc(100svh-var(--dashboard-header-height)-2rem)]">
          <p className="font-medium text-sm">Mục lục</p>
          <nav className="mt-3 flex flex-col gap-1 text-sm">
            {guideSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          {guideSections.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}

          <section className="rounded-lg border bg-background p-5 shadow-xs">
            <h2 className="font-semibold text-lg">Quy trình khuyến nghị</h2>
            <div className="mt-4 grid gap-3">
              {recommendedFlow.map((item, index) => (
                <div key={item} className="flex gap-3 rounded-md border p-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary font-medium text-primary-foreground text-sm">
                    {index + 1}
                  </span>
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border bg-background p-5 shadow-xs">
            <h2 className="font-semibold text-lg">Trạng thái và trường thường gặp</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {statusItems.map((item) => (
                <div key={item.label} className="rounded-md border p-3">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{item.label}</code>
                  <p className="mt-2 text-muted-foreground text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
