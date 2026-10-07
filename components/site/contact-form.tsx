"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_TOPICS, contactSchema, type ContactInput } from "@/lib/validations/contact";

/**
 * Writes a well-formed request to the registrar and hands it to the visitor's email app, so the reply
 * lands in their own inbox. (The API has no messaging endpoint, so nothing is pretended to be "sent".)
 */
export function ContactForm({ to }: { to: string }) {
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", studentId: "", topic: undefined, message: "" },
  });
  const { errors } = form.formState;
  const message = useWatch({ control: form.control, name: "message" }) ?? "";

  const onSubmit = form.handleSubmit((v) => {
    const subject = `[${v.topic}] ${v.name}${v.studentId ? ` (${v.studentId})` : ""}`;
    const body = `${v.message}\n\n— ${v.name}\n${v.email}${v.studentId ? `\nStudent ID: ${v.studentId}` : ""}`;
    window.location.assign(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    toast.success("Opening your email app", { description: "Your message is ready to send — just press Send." });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-3xl border bg-card p-6 shadow-sm">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="c-name">Your name</FieldLabel>
            <Input id="c-name" autoComplete="name" aria-invalid={!!errors.name} {...form.register("name")} />
            <FieldError errors={[errors.name]} />
          </Field>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="c-email">Email</FieldLabel>
            <Input id="c-email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register("email")} />
            <FieldError errors={[errors.email]} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.topic}>
            <FieldLabel htmlFor="c-topic">Topic</FieldLabel>
            <Controller
              control={form.control}
              name="topic"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger id="c-topic" className="w-full" aria-invalid={!!errors.topic} onBlur={field.onBlur}>
                    <SelectValue placeholder="What's it about?" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_TOPICS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.topic]} />
          </Field>
          <Field data-invalid={!!errors.studentId}>
            <FieldLabel htmlFor="c-sid">Student ID (optional)</FieldLabel>
            <Input id="c-sid" placeholder="2026-CSE-001" aria-invalid={!!errors.studentId} {...form.register("studentId")} />
            <FieldError errors={[errors.studentId]} />
          </Field>
        </div>
        <Field data-invalid={!!errors.message}>
          <FieldLabel htmlFor="c-message">Message</FieldLabel>
          <Textarea id="c-message" rows={6} aria-invalid={!!errors.message} {...form.register("message")} />
          <FieldDescription className="tabular-nums">{message.trim().length}/2000</FieldDescription>
          <FieldError errors={[errors.message]} />
        </Field>
        <Button type="submit" size="lg" className="w-full sm:w-fit">
          <MailIcon /> Write email
        </Button>
        <FieldDescription>Opens your email app with the message filled in, addressed to {to}.</FieldDescription>
      </FieldGroup>
    </form>
  );
}
