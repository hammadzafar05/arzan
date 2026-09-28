import type * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Label + input + error message, the one field pattern used by every form. */
export function Field({
  id,
  label,
  error,
  hint,
  aside,
  className,
  ...input
}: React.ComponentProps<typeof Input> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {aside}
      </div>
      <Input
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...input}
      />
      {hint && !error && <p className="text-muted-foreground text-xs">{hint}</p>}
      <InputError id={`${id}-error`} message={error} />
    </div>
  );
}

export function InputError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-destructive text-sm">
      {message}
    </p>
  );
}

/** Title + description at the top of a settings section. */
export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <header className="space-y-1">
      <h2 className="font-medium text-base">{title}</h2>
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
    </header>
  );
}
