import Image from "next/image";
import Link from "next/link";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileImage,
  HandCoins,
  Info,
  LayoutDashboard,
  ScanLine,
  Table2,
} from "lucide-react";
import type { Metadata } from "next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tài liệu CRM | Event FOB",
  description: "Tài liệu hướng dẫn cơ bản, affiliate và check-in cho CRM Event FOB.",
};

type ImageContent = {
  title: string;
  suggestedFile: string;
  caption: string;
};

type HeadingBlock = {
  type: "heading";
  eyebrow?: string;
  title: string;
  description?: string;
};

type ParagraphBlock = {
  type: "paragraph";
  paragraphs: string[];
};

type ImageBlock = {
  type: "image";
  image: ImageContent;
};

type ImageGridBlock = {
  type: "imageGrid";
  images: ImageContent[];
};

type TableBlock = {
  type: "table";
  title: string;
  description?: string;
  headers: string[];
  rows: string[][];
  caption?: string;
};

type NoteBlock = {
  type: "note";
  title: string;
  body: string;
};

type ChecklistBlock = {
  type: "checklist";
  title: string;
  items: string[];
};

type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | ImageGridBlock
  | TableBlock
  | NoteBlock
  | ChecklistBlock;

type DocumentSection = {
  id: string;
  label: string;
  title: string;
  summary: string;
  icon: typeof BookOpen;
  blocks: ContentBlock[];
};

const documentSections: DocumentSection[] = [
  {
    id: "basic-guide",
    label: "Hướng dẫn cơ bản",
    title: "1. Hướng dẫn cơ bản",
    summary:
      "Hướng dẫn vận hành cơ bản Admin The Future Of Business. Xem báo cáo, quản lý đơn hàng, hạng vé, khách hàng, tài khoản truy cập.",
    icon: LayoutDashboard,
    blocks: [
      {
        type: "heading",
        title: "1.1 Tổng quan dashboard",
        description: "Theo dõi nhanh số vé đăng ký, vé đã thanh toán, doanh thu và hiệu quả bán vé theo từng hạng.",
      },
      {
        type: "checklist",
        title: "Thông tin dashboad",
        items: [
          "Dashboard được chia ra làm 2 phần chính lả Tổng quan và CRM",
          "Tổng quan: Dùng biểu đồ hiệu suất để kiểm tra lượng đăng ký, thanh toán và doanh thu theo ngày.",
          "CRM: Xem báo cáo chuyên sâu, dùng các bảng và biểu đồ để đánh giá doanh thu, vé tặng, số lượt check-in và tỷ lệ chuyển đổi.",
          "Xem bảng hạng vé để nắm số lượng đã đăng ký, đã bán, vé tặng và doanh thu từng hạng.",
        ],
      },
      {
        type: "note",
        title: "Lưu ý",
        body: "Chỉ số doanh thu chỉ tính các đơn có trạng thái paydone.",
      },
      {
        type: "heading",
        title: "1.2 Quản lý đơn hàng",
        description: "Tạo vé, chỉnh thông tin khách, cập nhật thanh toán, xuất danh sách và xử lý check-in.",
      },
      {
        type: "checklist",
        title: "Thông tin quản trị đơn hàng",
        items: [
          "Thêm vé thủ công: Mở Dashboard > Đơn hàng hoặc bấm nút Thêm vé ở sidebar.",
          "Nhập thông tin khách hàng (tên, sđt, email), hạng vé, số lượng, loại vé (vé mua - vé tặng), Nếu nhập vé mua thì cần điền thêm giá tiền của từng vé để báo cáo có thể thống kê chính xác",
          "Dùng tìm kiếm để lọc theo tên, số điện thoại, email, mã đơn hoặc mã vé.",
          "Sửa thông tin vé: Bằng cách click vào mã vé hoặc chọn mục sửa ở cột tác vụ, để mở thông tin vé và có thể chỉnh sửa tại đây",
          "Xuất dữ liệu: Xuất dữ liệu theo định dạng CSV/EXCEL theo bộ lọc đang được chọn (Nếu không lọc dữ liệu gì thì sẽ xuất toàn bộ vé)",
        ],
      },
      {
        type: "image",
        image: {
          title: "Thêm vé",
          suggestedFile: "/uploads/themves.webp",
          caption: "Hướng dẫn thao tác thêm vé mới",
        },
      },
      {
        type: "note",
        title: "Lưu ý",
        body: "Mỗi vé vẫn có ordercode riêng. Khi thêm vé sẽ có thông báo gửi về email và zalo khách hàng tương tự khi đăng ký trên trang đăng ký vé. khi đổi trạng thái của vé thành paydone thì hệ thống cũng sẽ tự động gửi thông báo tới khách hàng.",
      },
      {
        type: "note",
        title: "Trường hợp khách thanh toán nhưng vé chưa được kích hoạt tự động",
        body: "Trường hợp này thường do khách hàng chuyển khoản sai nội dung thanh toán. Khi đó có thể vào tìm mã vé hoặc đơn hàng của khách hàng và chuyển trạng thái sang paydone để vé được kích hoạt và khách sẽ nhận đuọc thông tin vé.",
      },
      {
        type: "table",
        title: "Trạng thái vé",
        description: "Thông tin chi tiết các trạng thái vé",
        headers: ["Trạng thái", "Trạng thái tiếng việt", "Mô tả"],
        rows: [
          [
            "new",
            "Mới",
            "Vé đăn ký mới, ở trạng thái này người dùng vẫn có thể thanh toán trong vòng 15p sau khi đăng ký. Nếu không thanh toán trong thời gian này vé sẽ chuyển sang trạng thái expired",
          ],
          ["paydone", "Đã thanh toán", "Vế thanh toán thành công"],
          ["expired", "Hết hạn", "Hết thời gian thanh toán, link thanh toán sẽ không còn hiệu nghiệm."],
          ["cancel", "Hủy", "Đối với vé cần hủy vé"],
          ["Refund", "Hoàn tiền", "Đối với vé được hoàn tiền"],
        ],
      },
      {
        type: "heading",
        title: "1.3 Cấu hình hạng vé",
        description: "Quản lý các hạng vé, giá bán, thứ tự hiển thị và trạng thái bán trên website.",
      },
      {
        type: "checklist",
        title: "Thao tác với hạng vé",
        items: [
          "Mở mục Hạng vé để xem danh sách các hạng vé đang cấu hình.",
          "Thêm hoặc sửa tên vé, mã hạng vé, giá, số lượng và thứ tự hiển thị.",
          "Tắt hạng vé khi không muốn bán tiếp nhưng vẫn cần giữ dữ liệu cũ.",
          "Kiểm tra lại website sự kiện sau khi thay đổi hạng vé.",
        ],
      },
      {
        type: "heading",
        title: "1.4 Voucher và ưu đãi",
        description: "Tạo mã giảm giá, giới hạn lượt dùng và kiểm soát hiệu lực voucher.",
      },
      {
        type: "checklist",
        title: "Thao tác mục voucher",
        items: [
          "Mở mục Voucher để quản lý danh sách mã giảm giá.",
          "Tạo mã mới với loại giảm giá, giá trị giảm và số lượt được dùng.",
          "Theo dõi số lượt đã dùng để tránh vượt ngân sách ưu đãi.",
          "Tắt voucher khi chương trình kết thúc hoặc mã không còn hợp lệ.",
        ],
      },
      {
        type: "note",
        title: "Lưu ý",
        body: "Hiện chưa có chức năng áp dụng voucher trên website bán vé. Nên mục này tạm thời bỏ qua",
      },
      {
        type: "heading",
        title: "1.5 Khách hàng",
        description: "Tra cứu người mua vé và kiểm tra lịch sử đơn theo thông tin liên hệ.",
      },
      {
        type: "checklist",
        title: "Thao tác mục khách hàng",
        items: [
          "Mở mục Khách hàng để xem danh sách khách đã phát sinh đơn.",
          "Tìm theo tên, số điện thoại hoặc email khi cần hỗ trợ khách.",
          "Đối chiếu số lượng vé, trạng thái thanh toán và thông tin check-in trước khi phản hồi.",
        ],
      },
      {
        type: "heading",
        title: "1.6 Tài khoản",
        description: "Quản lý tài khoản đăng nhập và phân quyền sử dụng",
      },
      {
        type: "checklist",
        title: "Thao tác mục tài khoản",
        items: [
          "Đổi mật khẩu đăng nhập tài khoản hiện tại",
          "Thêm tài khoản truy cập admin và phân quyền",
          "Cập nhật trạng thái hoạt động của tài khoản",
        ],
      },
      {
        type: "table",
        title: "Bảng phân quyền tài khoản",
        headers: ["Quyền", "Phạm vi truy cập"],
        rows: [
          [
            "Admin",
            "Toàn quyền truy cập phần quản trị, có thể xem báo cáo, thêm/sửa dữ liệu, thêm tài khoản truy cập mới.",
          ],
          ["Staff", "Chỉ có quyền truy cập ở mục checkin. Các mục khác không thể  truy cập"],
        ],
      },
    ],
  },
  {
    id: "affiliate-guide",
    label: "Tài liệu affiliate",
    title: "2. Tài liệu affiliate",
    summary: "Chuẩn hóa link theo dõi nguồn, đọc báo cáo ref/UTM và đối soát hiệu quả affiliate.",
    icon: HandCoins,
    blocks: [
      {
        type: "heading",
        title: "Quy trình affiliate",
        description:
          "Affiliate cần được gắn mã nguồn rõ ràng ngay từ lúc gửi link bán vé để CRM lưu lại nguồn phát sinh đơn hàng.",
      },
      {
        type: "paragraph",
        paragraphs: [
          "Mỗi đối tác nên có một mã ref hoặc bộ UTM riêng để phục vụ báo cáo và đối soát hoa hồng sau chiến dịch. Khi đọc báo cáo, admin cần phân biệt đơn có nguồn affiliate, đơn direct và đơn thiếu tham số.",
        ],
      },
      {
        type: "note",
        title: "VD link Affiliate cho Sale/CTV",
        body: "Link bán vé + ?ref=[Tên nguồn không dấu, không cách dòng]",
      },
      {
        type: "paragraph",
        paragraphs: ["VD: https://smesummit.vn/?ref=duong-manh-hung"],
      },
      {
        type: "table",
        title: "Quy tắc đặt tham số",
        headers: ["Tham số", "Ví dụ", "Mục đích"],
        rows: [
          ["ref", "partner_a", "Xác định đối tác affiliate chính"],
          ["utm_source", "facebook", "Xác định kênh chạy truyền thông"],
          ["utm_campaign", "13654654313465", "Tách từng chiến dịch hoặc đợt bán vé"],
        ],
      },
      {
        type: "note",
        title: "Không chốt hoa hồng bằng đơn chưa thanh toán",
        body: "Việc đối soát chỉ nên thực hiện trên các đơn đã thanh toán thành công, đồng thời loại trừ vé tặng nếu chính sách hoa hồng không áp dụng cho loại vé này.",
      },
      {
        type: "checklist",
        title: "Checklist đối soát",
        items: [
          "Lọc đơn theo ref/UTM của affiliate cần đối soát.",
          "Chỉ tính các đơn đã thanh toán thành công, ưu tiên trạng thái paydone.",
          "Loại trừ vé tặng nếu chính sách hoa hồng chỉ áp dụng cho vé mua.",
          "Xem báo cáo ở mục nguồn Affiliate ở phần báo cáo CRM",
        ],
      },
    ],
  },
  {
    id: "checkin-guide",
    label: "Tài liệu check in",
    title: "3. Tài liệu check in",
    summary: "Quy trình soát vé bằng QR, ảnh QR hoặc nhập mã ordercode trong ngày diễn ra sự kiện.",
    icon: ScanLine,
    blocks: [
      {
        type: "heading",
        title: "Tạo tài khoản truy cập checkin",
        description:
          "Trước tiên cần tạo tài khoản quyền staff và gửi thông tin đăng nhập cho nhân viên checkin. Có thể tạo nhiều tài khoản hoặc 1 tài khoản dùng chung cho nhiều nhân viên checkin. Nhân viên checkin sẽ đăng nhập phần quét QR checkin bằng điện thoại",
      },
      {
        type: "heading",
        title: "Vận hành check-in tại cổng",
        description:
          "Quy trình check in sẽ như sau. Khách hàng mở mã QR dc gửi về qua zalo hoặc mở email để xem mã QR checkin. Sau đó sẽ đưa cho nhân viên checkin quét, quét thành công sẽ được phát thẻ tương ứng với hạng vé đã quét.",
      },
      {
        type: "paragraph",
        paragraphs: [
          "Nên bố trí phân công nhân sự theo không gian cho phù hợp. Có thể chia khu vực checkin theo các hạng vé khác nhau.",
        ],
      },
      {
        type: "imageGrid",
        images: [
          {
            title: "Màn hình quét QR",
            suggestedFile: "/uploads/quet.webp",
            caption: "Ảnh giao diện Dashboard > Checkin ở tab Quét QR.",
          },
          {
            title: "Nhập mã thủ công",
            suggestedFile: "/uploads/nhap.webp",
            caption: "Ảnh tab Nhập mã với ví dụ ordercode trên vé.",
          },
          {
            title: "Kết quả check-in",
            suggestedFile: "/uploads/thanhcong.webp",
            caption: "Ảnh hộp thoại kết quả thành công, trùng vé hoặc vé không hợp lệ.",
          },
        ],
      },
      {
        type: "imageGrid",
        images: [
          {
            title: "Check in thành công",
            suggestedFile: "/uploads/thanhcong.webp",
            caption: "Vé hợp lệ, lần đầu checkin",
          },
          {
            title: "Cảnh bảo check nhiều lần",
            suggestedFile: "/uploads/canhbao.webp",
            caption: "Vé hợp lệ nhưng đã checkin rồi",
          },
          {
            title: "Checkin thất bại",
            suggestedFile: "/uploads/loi1.webp",
            caption: "Vé chưa thanh toán, QR vé không hợp lệ",
          },
        ],
      },
      {
        type: "table",
        title: "Cách xử lý trạng thái",
        headers: ["Trạng thái", "Ý nghĩa", "Hành động tại cổng"],
        rows: [
          ["Thành công", "Vé hợp lệ và đã được ghi nhận check-in", "Kiểm tra tên, hạng vé rồi cho khách vào"],
          ["Đã check-in", "Vé từng được dùng trước đó", "Đối chiếu với trưởng ca trước khi xử lý"],
          ["Không hợp lệ", "Không tìm thấy mã vé hoặc QR sai", "Hướng khách về quầy hỗ trợ"],
          ["Chưa thanh toán", "Đơn chưa có trạng thái paydone", "Không cho qua cổng, chuyển quầy hỗ trợ"],
        ],
      },
      {
        type: "checklist",
        title: "Checklist trước khi mở cổng",
        items: [
          "Đăng nhập bằng tài khoản staff hoặc admin có quyền vào Dashboard > Checkin.",
          "Dùng Chrome trên thiết bị có camera sau để quét QR ổn định hơn.",
          "Kiểm tra internet, pin thiết bị và quyền camera trước giờ mở cổng.",
          "Chuẩn bị phương án nhập mã thủ công nếu camera hoặc ảnh QR không đọc được.",
        ],
      },
      {
        type: "note",
        title: "Lưu ý tại cổng",
        body: "Staff nên đóng kết quả sau mỗi lượt để màn hình sẵn sàng cho khách tiếp theo. Vé chưa thanh toán không nên được check-in tại cổng.",
      },
    ],
  },
];

function ImagePlaceholder({ image }: { readonly image: ImageContent }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-lg border bg-card shadow-xs">
      <div className="relative aspect-[21/9] min-h-100 bg-muted/40">
        <Image
          src={image.suggestedFile}
          alt={image.title}
          fill
          sizes="(min-width: 1024px) 30vw, 100vw"
          className="object-contain p-2"
        />
      </div>
      <figcaption className="border-t p-3">
        <div className="font-medium text-sm">{image.title}</div>
        <p className="mt-1 text-muted-foreground text-sm">{image.caption}</p>
      </figcaption>
    </figure>
  );
}

function ContentTable({ block }: { readonly block: TableBlock }) {
  return (
    <section className="rounded-lg border bg-background p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          <Table2 className="size-4" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-base">{block.title}</h2>
          {block.description ? <p className="mt-1 text-muted-foreground text-sm">{block.description}</p> : null}
        </div>
      </div>
      <div className="mt-4 rounded-lg border">
        <Table>
          {block.caption ? <TableCaption>{block.caption}</TableCaption> : null}
          <TableHeader>
            <TableRow>
              {block.headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {block.rows.map((row) => (
              <TableRow key={row.join("-")}>
                {row.map((cell, index) => (
                  <TableCell key={`${cell}-${index}`} className="whitespace-normal leading-6">
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function Checklist({ block }: { readonly block: ChecklistBlock }) {
  return (
    <section className="rounded-lg border bg-background p-4">
      <h2 className="font-semibold text-base">{block.title}</h2>
      <ol className="mt-3 flex flex-col gap-2 text-sm leading-6">
        {block.items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ContentBlockRenderer({ block }: { readonly block: ContentBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <section className="flex flex-col gap-2">
          {block.eyebrow ? (
            <Badge variant="outline" className="w-fit">
              {block.eyebrow}
            </Badge>
          ) : null}
          <h2 className="font-heading font-semibold text-xl leading-tight md:text-2xl">{block.title}</h2>
          {block.description ? <p className="max-w-4xl text-muted-foreground leading-7">{block.description}</p> : null}
        </section>
      );
    case "paragraph":
      return (
        <section className="flex max-w-5xl flex-col gap-4 text-sm leading-7 md:text-base">
          {block.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      );
    case "image":
      return <ImagePlaceholder image={block.image} />;
    case "imageGrid":
      return (
        <section className="grid gap-4 lg:grid-cols-3">
          {block.images.map((image) => (
            <ImagePlaceholder key={image.suggestedFile} image={image} />
          ))}
        </section>
      );
    case "table":
      return <ContentTable block={block} />;
    case "note":
      return (
        <Alert>
          <Info />
          <AlertTitle>{block.title}</AlertTitle>
          <AlertDescription>{block.body}</AlertDescription>
        </Alert>
      );
    case "checklist":
      return <Checklist block={block} />;
  }
}

function DocumentArticle({ section }: { readonly section: DocumentSection }) {
  const Icon = section.icon;

  return (
    <article className="min-w-0">
      <div className="flex flex-col gap-3">
        <Badge variant="outline" className="w-fit">
          <Icon data-icon="inline-start" />
          {section.label}
        </Badge>
        <div className="max-w-4xl">
          <h1 className="font-heading font-semibold text-2xl leading-tight md:text-3xl">{section.title}</h1>
          <p className="mt-3 text-base text-muted-foreground leading-7">{section.summary}</p>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-6">
        {section.blocks.map((block, index) => (
          <ContentBlockRenderer key={`${section.id}-${block.type}-${index}`} block={block} />
        ))}
      </div>
    </article>
  );
}

export default function DocumentPage() {
  return (
    <div className="@container/main mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="rounded-lg border bg-background p-5 shadow-xs md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-3">
              <BookOpen data-icon="inline-start" />
              Tài liệu sử dụng CRM
            </Badge>
            <h1 className="font-heading font-semibold text-2xl md:text-3xl">
              Tài liệu vận hành Admin Event Future Of Business
            </h1>
            <p className="mt-2 text-muted-foreground">
              Mỗi tab được dựng từ các block nội dung riêng, nên bạn có thể tự quyết định vị trí đoạn văn, hình ảnh,
              bảng, chú thích và checklist.
            </p>
          </div>
          <Link
            className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
            href="/dashboard/default"
            prefetch={false}
          >
            <ArrowLeft data-icon="inline-start" />
            Về dashboard
          </Link>
        </div>
      </header>

      <Tabs defaultValue={documentSections[0].id} orientation="vertical" className="flex flex-col gap-6 lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:sticky lg:top-[calc(var(--dashboard-header-height)+1rem)] lg:max-h-[calc(100svh-var(--dashboard-header-height)-2rem)] lg:w-72 lg:self-start">
          <div className="rounded-lg border bg-background p-4 shadow-xs">
            <h2 className="px-1 font-semibold text-sm">Nội dung</h2>
            <TabsList variant="line" className="mt-3 flex w-full flex-col items-stretch gap-1 p-0">
              {documentSections.map((section) => (
                <TabsTrigger key={section.id} value={section.id} className="h-auto justify-start px-3 py-2 text-left">
                  {section.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="rounded-lg border bg-background p-4 text-sm shadow-xs">
            <div className="font-semibold">Cách sửa nội dung</div>
            <p className="mt-3 text-muted-foreground leading-6">
              Sửa mảng <code className="rounded bg-muted px-1 py-0.5">blocks</code> trong từng mục. Thứ tự object trong
              mảng chính là thứ tự hiển thị trên trang.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 rounded-lg border bg-background p-5 shadow-xs md:p-6">
          {documentSections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="mt-0">
              <DocumentArticle section={section} />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
