import { CheckinScanner } from "./_components/checkin-scanner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function Page() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-md flex-col gap-4 md:max-w-2xl">
      <CheckinScanner />
    </div>
  );
}
