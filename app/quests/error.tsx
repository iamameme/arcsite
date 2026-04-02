"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuestErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function QuestsError({ error, unstable_retry }: QuestErrorProps) {
  useEffect(() => {
    console.error("Quest visualizer failed to render.", error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-6 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="size-5 text-destructive" />
            Couldn&apos;t load quest data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            ARDB data might be temporarily unavailable, or the upstream response format may have changed.
          </p>
          <div className="rounded-md border bg-muted p-3 font-mono text-xs">{error.message}</div>
          <Button onClick={() => unstable_retry()}>Retry</Button>
        </CardContent>
      </Card>
    </main>
  );
}
