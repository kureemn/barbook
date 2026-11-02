import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function PageLoading() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" role="status" aria-label="Loading" />
    </main>
  );
}

export function PageError({ message }: { message: string }) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <Alert variant="destructive">
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </main>
  );
}
