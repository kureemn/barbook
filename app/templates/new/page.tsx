"use client";

import { TemplateForm } from "@/components/templates/template-form";
import { PageLoading } from "@/components/workouts/page-states";
import { useRequireAuth } from "@/lib/neon/use-auth-guard";

export default function NewTemplatePage() {
  const status = useRequireAuth();
  if (status !== "authed") return <PageLoading />;
  return <TemplateForm />;
}
