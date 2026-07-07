"use client";

import * as React from "react";

import { SaveIcon } from "lucide-react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

import { createOrderAction, updateOrderAction } from "../actions";
import type { OrderFormMode, OrderRow } from "./schema";

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
const paymentStatusItems = [
  { value: "new", label: "new" },
  { value: "paydone", label: "paydone" },
  { value: "paid", label: "paid" },
] as const;

function Field({ children, label, name }: { children: React.ReactNode; label: string; name: string }) {
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

function SubmitButton({ children, pendingLabel }: { children: React.ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-fit" disabled={pending}>
      {pending ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
      {pending ? pendingLabel : children}
    </Button>
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

function MoneyInput({
  defaultValue,
  disabled,
  onValueChange,
}: {
  defaultValue?: number;
  disabled?: boolean;
  onValueChange?: (value: number) => void;
}) {
  const [rawValue, setRawValue] = React.useState(() => String(defaultValue ?? 0));

  React.useEffect(() => {
    const nextValue = disabled ? "0" : String(defaultValue ?? 0);
    setRawValue(nextValue);
    onValueChange?.(Number(nextValue) || 0);
  }, [defaultValue, disabled, onValueChange]);

  return (
    <>
      <Input
        id="money_display"
        inputMode="numeric"
        value={formatMoneyInput(rawValue)}
        disabled={disabled}
        placeholder="0"
        onChange={(event) => {
          const nextValue = event.target.value.replace(/[^\d]/g, "");
          setRawValue(nextValue);
          onValueChange?.(Number(nextValue) || 0);
        }}
      />
      <input type="hidden" name="money" value={disabled ? "0" : rawValue || "0"} />
    </>
  );
}
function ReadOnlyItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 min-h-5 break-words text-sm">{value}</div>
    </div>
  );
}

function ReadOnlyDetails({ order }: { order: OrderRow }) {
  return (
    <Section title="Dữ liệu khác">
      <div className="grid gap-3 md:grid-cols-2">
        <ReadOnlyItem
          label={"M\u00e3 \u0111\u01a1n h\u00e0ng"}
          value={<span className="font-medium">{order.order_id}</span>}
        />
        <ReadOnlyItem label="Mã vé" value={<span className="font-medium">{order.ordercode}</span>} />
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
  defaultStatus,
  includeCheckin = false,
  includeQuantity = false,
  includeStatus = false,
}: {
  defaultClass?: string;
  defaultEmail?: string;
  defaultGender?: string;
  defaultIsCheckin?: number;
  defaultMoney?: number;
  defaultName?: string;
  defaultPhone?: string;
  defaultTicketType?: string;
  defaultStatus?: string;
  includeCheckin?: boolean;
  includeQuantity?: boolean;
  includeStatus?: boolean;
}) {
  const [ticketType, setTicketType] = React.useState(defaultTicketType ?? "paid");
  const [quantity, setQuantity] = React.useState(1);
  const [money, setMoney] = React.useState(defaultMoney ?? 0);
  const isGift = ticketType === "gift";
  const totalMoney = isGift ? 0 : quantity * money;

  return (
    <>
      <Section title={"Th\u00f4ng tin kh\u00e1ch h\u00e0ng"}>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label={"T\u00ean kh\u00e1ch h\u00e0ng"} name="name">
            <Input id="name" name="name" defaultValue={defaultName} required />
          </Field>
          <Field label={"Gi\u1edbi t\u00ednh"} name="gender">
            <SelectField name="gender" defaultValue={defaultGender ?? "none"} items={genderItems} />
          </Field>
        </div>
        <div className="grid gap-3 md:grid-cols-1">
          <Field label={"S\u1ed1 \u0111i\u1ec7n tho\u1ea1i"} name="phone">
            <Input id="phone" name="phone" defaultValue={defaultPhone} required />
          </Field>
          <Field label="Email" name="email">
            <Input id="email" name="email" type="email" defaultValue={defaultEmail} required />
          </Field>
        </div>
      </Section>
      <Section title={"Th\u00f4ng tin v\u00e9"}>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label={"Lo\u1ea1i v\u00e9"} name="ticket_type">
            <SelectField name="ticket_type" value={ticketType} onValueChange={setTicketType} items={ticketTypeItems} />
          </Field>
          <Field label={"H\u1ea1ng v\u00e9"} name="class">
            <Select
              name="class"
              defaultValue={defaultClass ?? "GOLD"}
              items={ticketClassItems.map((item) => ({ value: item, label: item }))}
            >
              <SelectTrigger id="class" className="w-full">
                <SelectValue placeholder={"Ch\u1ecdn h\u1ea1ng v\u00e9"} />
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
          {includeQuantity ? (
            <Field label={"S\u1ed1 l\u01b0\u1ee3ng v\u00e9"} name="quantity">
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                max={500}
                step={1}
                value={quantity}
                onChange={(event) => setQuantity(Math.min(Math.max(Number(event.target.value) || 1, 1), 500))}
                required
              />
            </Field>
          ) : null}
          <Field label={includeQuantity ? "Gi\u00e1 t\u1eebng v\u00e9" : "Gi\u00e1 v\u00e9"} name="money">
            <MoneyInput defaultValue={defaultMoney ?? 0} disabled={isGift} onValueChange={setMoney} />
          </Field>
          {includeQuantity ? (
            <div className="rounded-lg border bg-muted/30 p-3 md:col-span-2">
              <div className="text-muted-foreground text-xs">{"Th\u00e0nh ti\u1ec1n"}</div>
              <div className="mt-1 font-medium text-base">{formatMoneyInput(totalMoney)} VND</div>
            </div>
          ) : null}
          {includeStatus ? (
            <Field label={"Tr\u1ea1ng th\u00e1i thanh to\u00e1n"} name="status">
              <SelectField name="status" defaultValue={defaultStatus ?? "new"} items={paymentStatusItems} />
            </Field>
          ) : null}
          {includeCheckin ? (
            <Field label={"Tr\u1ea1ng th\u00e1i check-in"} name="is_checkin">
              <SelectField name="is_checkin" defaultValue={String(defaultIsCheckin ?? 0)} items={checkinItems} />
            </Field>
          ) : null}
        </div>
      </Section>
    </>
  );
}

function CreateOrderForm() {
  const formAction = React.useCallback(async (formData: FormData) => {
    try {
      await createOrderAction(formData);
      toast.success("Th\u00eam v\u00e9 th\u00e0nh c\u00f4ng");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kh\u00f4ng th\u1ec3 th\u00eam v\u00e9");
    }
  }, []);

  return (
    <form action={formAction} className="grid gap-5">
      <TicketFields includeQuantity />
      <SubmitButton pendingLabel={"\u0110ang th\u00eam v\u00e9..."}>{"Th\u00eam v\u00e9"}</SubmitButton>
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
        defaultStatus={order.status || "new"}
        includeCheckin
        includeStatus
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
