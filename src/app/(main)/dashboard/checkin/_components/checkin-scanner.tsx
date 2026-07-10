"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ImageUp,
  Keyboard,
  Loader2,
  QrCode,
  RotateCcw,
  ScanLine,
  TicketCheck,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { type CheckinResult, type CheckinSource, checkinTicketAction } from "../actions";

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

type ResultStyle = {
  icon: typeof CheckCircle2;
  shell: string;
  iconBox: string;
  title: string;
  button: string;
};

const gateZone = {
  id: "gate",
  name: "Cổng checkin",
};

const resultStyles: Record<CheckinResult["status"], ResultStyle> = {
  success: {
    icon: CheckCircle2,
    shell: "border-emerald-500 bg-emerald-950 text-emerald-50 shadow-emerald-950/30",
    iconBox: "bg-emerald-500 text-white",
    title: "text-emerald-100",
    button: "bg-emerald-500 text-white hover:bg-emerald-400",
  },
  repeat: {
    icon: RotateCcw,
    shell: "border-amber-500 bg-stone-950 text-amber-50 shadow-amber-950/30",
    iconBox: "bg-amber-500 text-white",
    title: "text-amber-100",
    button: "bg-amber-500 text-white hover:bg-amber-400",
  },
  invalid: {
    icon: AlertTriangle,
    shell: "border-rose-500 bg-rose-950 text-rose-50 shadow-rose-950/30",
    iconBox: "bg-rose-500 text-white",
    title: "text-rose-100",
    button: "bg-rose-500 text-white hover:bg-rose-400",
  },
};

function getBarcodeDetector() {
  if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
    return null;
  }

  return new (window as Window & { BarcodeDetector: BarcodeDetectorConstructor }).BarcodeDetector({
    formats: ["qr_code"],
  });
}

function getScannedCode(result: CheckinResult) {
  if (result.ticket?.ordercode) {
    return result.ticket.ordercode;
  }

  return result.status === "invalid" ? (result.scannedCode ?? "") : "";
}

function getResultRows(result: CheckinResult) {
  const ticket = result.ticket;
  const scannedCode = getScannedCode(result);
  const rows: Array<[string, string]> = [];

  if (scannedCode) {
    rows.push(["Ma ve", scannedCode]);
  }

  if (!ticket) {
    return rows;
  }

  rows.unshift(["Tên", ticket.name || "-"]);
  rows.push(["Số lần check-in", `${ticket.checkinCount} lần`]);
  rows.push(["Thời gian", ticket.checkinTime || "-"]);
  rows.push(["Hạng vé", ticket.ticketClass || "-"]);

  return rows;
}

export function CheckinScanner() {
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isPending, startTransition] = useTransition();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const detectorRef = useRef<ReturnType<typeof getBarcodeDetector>>(null);

  const isPaused = Boolean(result) || isPending;

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    streamRef.current = null;
    scanningRef.current = false;
    setIsCameraActive(false);
  }, []);

  const submitCode = useCallback(
    (code: string, source: CheckinSource) => {
      const normalizedCode = code.trim();

      if (!normalizedCode || isPending || result) {
        return;
      }

      startTransition(async () => {
        const nextResult = await checkinTicketAction({
          ordercode: normalizedCode,
          source,
          zoneId: gateZone.id,
          zoneName: gateZone.name,
        });
        setResult(nextResult);
      });
    },
    [isPending, result],
  );

  const scanFrame = useCallback(async () => {
    const detector = detectorRef.current;
    const video = videoRef.current;

    if (!detector || !video || scanningRef.current || isPaused) {
      return;
    }

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      window.requestAnimationFrame(scanFrame);
      return;
    }

    scanningRef.current = true;

    try {
      const codes = await detector.detect(video);
      const code = codes[0]?.rawValue;

      if (code) {
        submitCode(code, "camera");
        return;
      }
    } catch {
      setCameraError("Không thể đọc được QR từ camera. Hãy thử lại hoặc nhập mã vé.");
    } finally {
      scanningRef.current = false;
    }

    window.requestAnimationFrame(scanFrame);
  }, [isPaused, submitCode]);

  const startCamera = useCallback(async () => {
    setCameraError("");
    const detector = getBarcodeDetector();

    if (!detector) {
      setCameraError("Trình duyệt chưa hỗ trợ quét QR. Hãy dùng Chrome trên Android hoặc nhập mã vé.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Thiết bị hoặc trình duyệt không hỗ trợ camera.");
      return;
    }

    detectorRef.current = detector;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      window.requestAnimationFrame(scanFrame);
    } catch {
      setCameraError("Không mở được camera. Hay cấp quyền camera hoặc tải ảnh QR.");
    }
  }, [scanFrame]);

  useEffect(() => {
    return stopCamera;
  }, [stopCamera]);

  useEffect(() => {
    if (!isPaused && isCameraActive) {
      window.requestAnimationFrame(scanFrame);
    }
  }, [isCameraActive, isPaused, scanFrame]);

  const handleImageUpload = async (file: File | undefined) => {
    if (!file || isPending || result) {
      return;
    }

    const detector = getBarcodeDetector();

    if (!detector) {
      setCameraError("Trình duyệt chưa hỗ trợ quét QR. Hãy dùng Chrome trên Android hoặc nhập mã vé.");
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);
      bitmap.close();
      const code = codes[0]?.rawValue;

      if (!code) {
        setCameraError("Không tìm thấy mã QR trong ảnh vừa chọn");
        return;
      }

      submitCode(code, "upload");
    } catch {
      setCameraError("Không đọc được ảnh QR. Hay thử ảnh rõ hơn hoặc nhập vé.");
    }
  };

  return (
    <>
      <Card className="min-h-0 rounded-lg">
        <CardHeader className="border-b">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <TicketCheck className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-xl leading-tight md:text-2xl">Khu vực soát vé</CardTitle>
              <CardDescription>Tap trung check-in bằng camera, ảnh QR hoặc mã vé.</CardDescription>
            </div>
            <CardAction>
              <Badge variant={isCameraActive ? "default" : "outline"}>
                {isCameraActive ? "Đang quét" : "Sẵn sàng"}
              </Badge>
            </CardAction>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4">
          <Tabs defaultValue="camera" className="grid gap-4">
            <TabsList className="grid h-14 w-full grid-cols-2">
              <TabsTrigger value="camera" className="gap-2 font-semibold text-base">
                <ScanLine />
                Quét QR
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-2 font-semibold text-base">
                <Keyboard />
                Nhập mã
              </TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="grid gap-4">
              <div className="relative overflow-hidden rounded-lg border bg-muted/60">
                <div className="relative aspect-square md:aspect-[4/3]">
                  <video
                    ref={videoRef}
                    className={cn("h-full w-full object-cover", !isCameraActive && "opacity-0")}
                    muted
                    playsInline
                  />
                  <div className="pointer-events-none absolute inset-0 grid place-items-center p-8">
                    <div className="relative grid size-full max-h-96 max-w-96 place-items-center rounded-2xl border border-background/80 bg-background/30 shadow-[0_0_0_999px_rgb(0_0_0/0.20)]">
                      <span className="absolute top-4 left-4 size-10 rounded-tl-xl border-background border-t-2 border-l-2" />
                      <span className="absolute top-4 right-4 size-10 rounded-tr-xl border-background border-t-2 border-r-2" />
                      <span className="absolute bottom-4 left-4 size-10 rounded-bl-xl border-background border-b-2 border-l-2" />
                      <span className="absolute right-4 bottom-4 size-10 rounded-br-xl border-background border-r-2 border-b-2" />
                      <div className="grid place-items-center gap-3 text-center text-muted-foreground">
                        <div className="grid size-16 place-items-center rounded-lg border bg-card shadow-sm">
                          {isPending ? <Loader2 className="size-8 animate-spin" /> : <QrCode className="size-8" />}
                        </div>
                        <p className="text-sm md:text-base">Hướng camera vào mã QR</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Button
                  type="button"
                  size="lg"
                  className="h-14 w-full text-base"
                  onClick={() => void startCamera()}
                  disabled={isPending}
                >
                  {isCameraActive ? <ScanLine /> : <Camera />}
                  {isCameraActive ? "Đang quét QR" : "Bắt đầu quét QR"}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Label
                    htmlFor="qr-upload"
                    className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border bg-background font-medium text-muted-foreground text-sm hover:bg-muted"
                  >
                    <ImageUp className="size-4" />
                    Chọn ảnh
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12"
                    onClick={stopCamera}
                    disabled={!isCameraActive || isPending}
                  >
                    <X />
                    Tắt camera
                  </Button>
                </div>
              </div>

              <Input
                id="qr-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => void handleImageUpload(event.target.files?.[0])}
                disabled={isPending || Boolean(result)}
              />
            </TabsContent>

            <TabsContent value="manual" className="grid gap-4">
              <form
                className="grid gap-4 rounded-lg border bg-muted/30 p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitCode(manualCode, "manual");
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="manual-code">Mã ordercode trên vé</Label>
                  <Input
                    id="manual-code"
                    value={manualCode}
                    onChange={(event) => setManualCode(event.target.value.toUpperCase())}
                    placeholder="VD: AD123456"
                    autoComplete="off"
                    className="h-14 text-center font-semibold text-xl tracking-wider"
                    disabled={isPending || Boolean(result)}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-14 w-full text-base"
                  disabled={isPending || Boolean(result)}
                >
                  {isPending ? <Loader2 className="animate-spin" /> : <TicketCheck />}
                  Hoàn tất check-in
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {cameraError && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-700 text-sm dark:text-amber-300">
              {cameraError}
            </div>
          )}
        </CardContent>
      </Card>

      <CheckinResultDialog
        result={result}
        onClose={() => {
          setResult(null);
          setManualCode("");
        }}
      />
    </>
  );
}

function CheckinResultDialog({ result, onClose }: { result: CheckinResult | null; onClose: () => void }) {
  if (!result) {
    return null;
  }

  const styles = resultStyles[result.status];
  const Icon = styles.icon;
  const rows = getResultRows(result);

  return (
    <Dialog
      open={Boolean(result)}
      disablePointerDismissal
      onOpenChange={(open, eventDetails) => {
        if (!open && eventDetails.reason === "close-press") {
          onClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          "max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1rem)] gap-0 overflow-y-auto rounded-lg p-0 shadow-2xl sm:max-w-lg",
          styles.shell,
        )}
      >
        <div className="p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <div className={cn("grid size-14 shrink-0 place-items-center rounded-lg", styles.iconBox)}>
              <Icon className="size-7" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className={cn("font-heading font-semibold text-2xl leading-tight", styles.title)}>
                {result.title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-white/70">{result.message}</DialogDescription>
            </div>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-white/70 hover:bg-white/10 hover:text-white"
                />
              }
            >
              <X />
              <span className="sr-only">Đóng</span>
            </DialogClose>
          </div>

          {result.ticket?.ticketClass && (
            <div className="mt-7 text-center">
              <div className="font-semibold text-white/50 text-xs uppercase tracking-[0.3em]">Hạng vé</div>
              <div className="mx-auto mt-3 w-fit min-w-48 rounded-lg border border-white/50 px-8 py-3 font-bold font-heading text-3xl uppercase">
                {result.ticket.ticketClass}
              </div>
            </div>
          )}

          {rows.length > 0 && (
            <div className="mt-7 grid gap-2 rounded-lg border border-white/20 p-3">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-lg bg-white/10 px-3 py-3">
                  <span className="font-semibold text-white/55 text-xs uppercase">{label}</span>
                  <span className="min-w-0 text-right font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-white/10 border-t p-5">
          <Button type="button" size="lg" className={cn("h-14 w-full text-base", styles.button)} onClick={onClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
