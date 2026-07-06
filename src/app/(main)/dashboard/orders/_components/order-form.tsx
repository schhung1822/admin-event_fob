"use client";

import * as React from "react";
import { SaveIcon } from "lucide-react";

import { createOrderAction, updateOrderAction } from "../actions";
import type { OrderFormMode, OrderRow } from "./schema";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const genderItems = [
  { value: "none", label: "Không chọn" },
  { value: "m", label: "Nam" },
  { value: "f", label: "Nữ" },
  { value: "other", label: "Khác" },
] as const;

const ticketTypeItems = [
  { value: "paid", label: "Vé mua" },
  { value: "gift", label: "Vé tặng" },
] as const;

const ticketClassItems = ["GOLD", "RUBY", "VIP", "DIAMOND"] as const;
const checkinItems = [
  { value: "0", label: "Chưa check-in" },
  { value: "1", label: "Đã check-in" },
] as const;

function Field({
  children,
  label,
  name,
}: {
  children: React.ReactNode;
  label: string;
  name: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
    </div>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="grid gap-3">
      <div className="flex items-center gap-3">
        <h3 className="font-medium text-sm">{title}</h3>
        <Separator className="flex-1" />
      </div>
      {children}
    </section>
  );
}

function SelectField({
  defaultValue,
  items,
  name,
  onValueChange,
  value,
}: {
  defaultValue?: string;
  items: readonly { value: string; label: string }[];
  name: string;
  onValueChange?: (value: string) => void;
  value?: string;
}) {
  return (
    <Select
      name={name}
      defaultValue={defaultValue}
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue !== null) {
          onValueChange?.(nextValue);
        }
      }}
      items={items}
    >
      <SelectTrigger id={name} className="w-full">
        <SelectValue placeholder="Chọn" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function formatMoneyInput(value: string | number | undefined) {
  const digits = String(value ?? "").replace(/[^\d]/g, "");

  if (!digits) {
    return "";
  }

  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(digits));
}

function MoneyInput({ defaultValue, disabled }: { defaultValue?: number; disabled?: boolean }) {
  const [rawValue, setRawValue] = React.useState(() => String(defaultValue ?? 0));

  React.useEffect(() => {
    setRawValue(disabled ? "0" : String(defaultValue ?? 0));
  }, [defaultValue, disabled]);

  return (
    <>
      <Input
        id="money_display"
        inputMode="numeric"
        value={formatMoneyInput(rawValue)}
        disabled={disabled}
        placeholder="0"
        onChange={(event) => setRawValue(event.target.value.replace(/[^\d]/g, ""))}
      />
      <input type="hidden" name="money" value={disabled ? "0" : rawValue || "0"} />
    </>
  );
}
function ReadOnlyItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 min-h-5 break-words text-sm">{value || "-"}</div>
    </div>
  );
}

function ReadOnlyDetails({ order }: { order: OrderRow }) {
  return (
    <Section title="Dữ liệu khác">
      <div className="grid gap-3 md:grid-cols-2">
        <ReadOnlyItem label="Mã vé" value={<span className="font-medium">{order.ordercode}</span>} />
        <ReadOnlyItem label="Trạng thái thanh toán" value={<Badge variant="outline">{order.status || "-"}</Badge>} />
        <ReadOnlyItem label="Thời gian tạo" value={order.create_time} />
        <ReadOnlyItem label="Thời gian thanh toán" value={order.payment_time} />
        <ReadOnlyItem label="Thời gian check-in" value={order.checkin_time} />
        <ReadOnlyItem label="Số lần check-in" value={order.number_checkin} />
        <ReadOnlyItem label="Nghề nghiệp/Giá gốc" value={order.career} />
        <ReadOnlyItem label="Thương hiệu" value={order.brand} />
        <ReadOnlyItem label="Nguồn" value={order.source} />
        <ReadOnlyItem label="Nguồn Ref" value={order.ref} />
        <ReadOnlyItem label="Voucher" value={order.voucher} />
        <ReadOnlyItem label="UTM Source" value={order.utm_source} />
        <ReadOnlyItem label="UTM Medium" value={order.utm_medium} />
        <ReadOnlyItem label="UTM Campaign" value={order.utm_campaign} />
        <ReadOnlyItem label="Step Mail" value={order.step_mail === null ? "-" : `Step ${order.step_mail}`} />
        <ReadOnlyItem label="Step ZBS" value={order.step_zbs === null ? "-" : `Step ${order.step_zbs}`} />
      </div>
    </Section>
  );
}

function TicketFields({
  defaultClass,
  defaultEmail,
  defaultGender,
  defaultIsCheckin,
  defaultMoney,
  defaultName,
  defaultPhone,
  defaultTicketType,
  includeCheckin = false,
}: {
  defaultClass?: string;
  defaultEmail?: string;
  defaultGender?: string;
  defaultIsCheckin?: number;
  defaultMoney?: number;
  defaultName?: string;
  defaultPhone?: string;
  defaultTicketType?: string;
  includeCheckin?: boolean;
}) {
  const [ticketType, setTicketType] = React.useState(defaultTicketType || "paid");
  const isGift = ticketType === "gift";

  return (
    <>
      <Section title="Thông tin khách hàng">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Tên khách hàng" name="name">
            <Input id="name" name="name" defaultValue={defaultName} required />
          </Field>
          <Field label="Giới tính" name="gender">
            <SelectField name="gender" defaultValue={defaultGender || "none"} items={genderItems} />
          </Field>
        </div>
        <div className="grid gap-3 md:grid-cols-1">
          <Field label="Số điện thoại" name="phone">
            <Input id="phone" name="phone" defaultValue={defaultPhone} required />
          </Field>
          <Field label="Email" name="email">
            <Input id="email" name="email" type="email" defaultValue={defaultEmail} required />
          </Field>
        </div>
      </Section>
      <Section title="Thông tin vé">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Loại vé" name="ticket_type">
            <SelectField
              name="ticket_type"
              value={ticketType}
              onValueChange={setTicketType}
              items={ticketTypeItems}
            />
          </Field>
          <Field label="Hạng vé" name="class">
            <Select name="class" defaultValue={defaultClass || "GOLD"} items={ticketClassItems.map((item) => ({ value: item, label: item }))}>
              <SelectTrigger id="class" className="w-full">
                <SelectValue placeholder="Chọn hạng vé" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ticketClassItems.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Giá vé" name="money">
            <MoneyInput defaultValue={defaultMoney ?? 0} disabled={isGift} />
          </Field>
          {includeCheckin ? (
            <Field label="Trạng thái check-in" name="is_checkin">
              <SelectField name="is_checkin" defaultValue={String(defaultIsCheckin ?? 0)} items={checkinItems} />
            </Field>
          ) : null}
        </div>
      </Section>
    </>
  );
}

function CreateOrderForm() {
  return (
    <form action={createOrderAction} className="grid gap-5">
      <TicketFields />
      <Button type="submit" className="w-fit">
        <SaveIcon data-icon="inline-start" />
        Thêm vé
      </Button>
    </form>
  );
}

function EditOrderForm({ order }: { order: OrderRow }) {
  return (
    <form action={updateOrderAction} className="grid gap-5">
      <input type="hidden" name="id" value={order.id} />
      <TicketFields
        defaultClass={order.class || "GOLD"}
        defaultEmail={order.email}
        defaultGender={order.gender || "none"}
        defaultIsCheckin={order.is_checkin}
        defaultMoney={order.money}
        defaultName={order.name}
        defaultPhone={order.phone}
        defaultTicketType={order.is_gift ? "gift" : "paid"}
        includeCheckin
      />
      <Button type="submit" className="w-fit">
        <SaveIcon data-icon="inline-start" />
        Lưu thay đổi
      </Button>
      <ReadOnlyDetails order={order} />
    </form>
  );
}

export function OrderForm({ mode, order }: { mode: OrderFormMode; order?: OrderRow }) {
  if (mode === "create") {
    return <CreateOrderForm />;
  }

  if (!order) {
    return null;
  }

  return <EditOrderForm order={order} />;
}
