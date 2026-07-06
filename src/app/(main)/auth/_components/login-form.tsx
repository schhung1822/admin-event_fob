"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Eye, EyeOff } from "lucide-react";

import { loginAction } from "@/app/(main)/auth/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? "Đang đăng nhập..." : "Đăng nhập"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, {});
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Field className="gap-1.5">
          <FieldLabel htmlFor="login-username">Tài khoản</FieldLabel>
          <Input
            id="login-username"
            name="username"
            type="text"
            placeholder="admin"
            autoComplete="username"
            required
          />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="login-password">Mật khẩu</FieldLabel>
          <div className="relative">
            <Input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
        </Field>
        <Field orientation="horizontal">
          <Checkbox id="login-remember" checked={remember} onCheckedChange={(checked) => setRemember(checked === true)} />
          {remember ? <input type="hidden" name="remember" value="on" /> : null}
          <FieldContent>
            <FieldLabel htmlFor="login-remember" className="font-normal">
              Ghi nhớ trong 30 ngày
            </FieldLabel>
          </FieldContent>
        </Field>
      </FieldGroup>
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}