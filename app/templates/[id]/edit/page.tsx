"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TemplateForm } from "@/components/templates/template-form";
import { PageError, PageLoading } from "@/components/workouts/page-states";
import { useRequireAuth } from "@/lib/neon/use-auth-guard";
import { loadTemplate, type Template } from "@/lib/templates";

export default function EditTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const status = useRequireAuth();
  const [template, setTemplate] = useState<Template | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authed") return;
    loadTemplate(id)
      .then((loaded) => {
        if (loaded) setTemplate(loaded);
        else setError("We couldn't find that template.");
      })
      .catch(() => setError("We couldn't find that template."));
  }, [status, id]);

  if (error) return <PageError message={error} />;
  if (status !== "authed" || !template) return <PageLoading />;
  return <TemplateForm template={template} />;
}
