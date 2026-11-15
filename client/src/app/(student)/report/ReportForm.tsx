"use client";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { copy } from "@/lib/copy";
import { useCreateItem } from "@/lib/api/hooks";
import type { CreateItemResponse, ItemType } from "@/lib/api/types";
import { toLocalInput } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { CategoryChips, ZoneSelect } from "@/components/ui/pickers";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { EmptyState } from "@/components/ui/states";
import { MatchList } from "@/components/MatchList";

const r = copy.report;
const base = {
  category: z.string().min(1, copy.auth.required),
  title: z.string().trim().min(3, r.titleShort).max(120),
  publicDescription: z.string().trim().min(10, r.descShort).max(1500),
  zone: z.string().min(1, copy.auth.required),
  occurredAt: z.string().min(1, copy.auth.required).refine((v) => new Date(v).getTime() <= Date.now() + 60_000, r.futureDate),
  eventTag: z.string().optional(),
  holdLocation: z.string().max(200).optional(),
};
const foundSchema = z.object({ ...base, privateDetails: z.string().trim().min(10, r.privateShort).max(2000) });
const lostSchema = z.object({
  ...base,
  privateDetails: z.string().trim().max(2000).refine((v) => v === "" || v.length >= 10, r.privateShort),
});
type Values = z.infer<typeof foundSchema>;

const stepFields: (keyof Values)[][] = [[], ["category", "title", "publicDescription", "zone", "occurredAt"], ["privateDetails"]];

export function ReportForm({ type }: { type: ItemType }) {
  const found = type === "FOUND";
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState<string>();
  const [result, setResult] = useState<CreateItemResponse | null>(null);
  const create = useCreateItem();
  const form = useForm<Values>({
    resolver: zodResolver(found ? foundSchema : lostSchema) as never,
    defaultValues: {
      category: "", title: "", publicDescription: "", zone: "", occurredAt: toLocalInput(new Date()),
      eventTag: "", holdLocation: "", privateDetails: "",
    },
    mode: "onTouched",
  });
  const { register, control, watch, trigger, handleSubmit, formState } = form;
  const e = formState.errors;
  const category = watch("category");
  const desc = watch("publicDescription") ?? "";

  async function next() {
    if (step === 0 && found && !photo) {
      setPhotoErr(r.photoRequired);
      return;
    }
    if (stepFields[step].length && !(await trigger(stepFields[step]))) return;
    setStep((s) => s + 1);
  }

  function submit(v: Values) {
    if (create.isPending) return;
    create.mutate(
      {
        type,
        category: v.category as never,
        title: v.title,
        publicDescription: v.publicDescription,
        zone: v.zone,
        occurredAt: new Date(v.occurredAt).toISOString(),
        eventTag: v.eventTag || undefined,
        holdLocation: found ? v.holdLocation || undefined : undefined,
        imageUrl: photo ?? undefined,
        privateDetails: v.privateDetails || undefined,
      },
      {
        onSuccess: (res) => {
          toast.success(copy.toast.reported);
          setResult(res);
        },
        onError: () => toast.error(r.submitFailed),
      },
    );
  }

  if (result) {
    return (
      <div className="space-y-6" data-testid="report-result">
        <div>
          <h1 className="font-display text-3xl">{r.reported}</h1>
          <p className="text-ink-soft">{r.reportedBody}</p>
        </div>
        <h2 className="font-display text-2xl">{r.topMatches}</h2>
        {result.matches.length ? (
          <MatchList matches={result.matches} />
        ) : (
          <EmptyState icon={<Sparkles size={26} strokeWidth={1.75} />} title={r.noMatches} body={r.noMatchesBody} />
        )}
        <div className="flex gap-3">
          <Button href="/board" variant="secondary">{copy.action.seeBoard}</Button>
          <Button href={`/items/${result.id}`}>{copy.action.openItem}</Button>
        </div>
      </div>
    );
  }

  const last = step === 2;
  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6" data-testid="report-form">
      <div>
        <h1 className="font-display text-3xl">{found ? r.foundTitle : r.lostTitle}</h1>
        <p className="mt-1 text-ink-soft" aria-live="polite">
          {r.stepOf(step + 1, 3)}: {r.steps[step]}
        </p>
        <div aria-hidden className="mt-3 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-ultra" : "bg-rule"}`} />
          ))}
        </div>
      </div>

      {step === 0 ? (
        <section className="space-y-3" data-testid="step-photo">
          <p className="text-ink-soft">{found ? r.photoHelpFound : r.photoHelpLost}</p>
          <PhotoPicker value={photo} onChange={(u) => { setPhoto(u); setPhotoErr(undefined); }} error={photoErr} />
        </section>
      ) : null}

      {step === 1 ? (
        <section className="space-y-5" data-testid="step-details">
          <Field label={r.category} error={e.category?.message}>
            {() => (
              <Controller
                control={control}
                name="category"
                render={({ field }) => <CategoryChips label={r.category} value={field.value} onChange={field.onChange} />}
              />
            )}
          </Field>
          <Field label={r.titleLabel} error={e.title?.message} hint={r.titleHint}>
            {(p) => <Input {...p} {...register("title")} maxLength={120} />}
          </Field>
          <Field label={r.description} error={e.publicDescription?.message} hint={r.descriptionHint} right={<span className="text-sm text-ink-soft num">{desc.length}/1500</span>}>
            {(p) => <Textarea {...p} {...register("publicDescription")} maxLength={1500} />}
          </Field>
          <Field label={r.zone} error={e.zone?.message}>
            {(p) => (
              <Controller control={control} name="zone" render={({ field }) => <ZoneSelect {...p} value={field.value} onChange={field.onChange} />} />
            )}
          </Field>
          <Field label={r.when} error={e.occurredAt?.message}>
            {(p) => <Input {...p} type="datetime-local" max={toLocalInput(new Date())} {...register("occurredAt")} />}
          </Field>
          <Field label={r.event}>
            {(p) => (
              <Select {...p} {...register("eventTag")}>
                <option value="">{copy.board.eventAny}</option>
                {copy.board.events.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
              </Select>
            )}
          </Field>
          {found ? (
            <Field label={r.holdLocation} hint={r.holdHint}>
              {(p) => <Input {...p} {...register("holdLocation")} />}
            </Field>
          ) : null}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4" data-testid="step-private">
          <div className="rounded-[12px] bg-ultra-tint p-4">
            <h2 className="font-display text-xl">{found ? r.privateTitleFound : r.privateTitleLost}</h2>
            <p className="mt-1">{found ? r.privateHelpFound : r.privateHelpLost}</p>
          </div>
          <Field
            label={found ? r.privateLabel : `${r.privateLabel} (${r.privateOptional.toLowerCase()})`}
            error={e.privateDetails?.message}
            hint={r.hints[category] ?? r.hints.OTHER}
          >
            {(p) => <Textarea {...p} {...register("privateDetails")} maxLength={2000} />}
          </Field>
        </section>
      ) : null}

      <div className="safe-bottom sticky bottom-20 flex gap-3 bg-paper/95 py-3 md:static md:bg-transparent md:p-0">
        {step > 0 ? (
          <Button variant="secondary" size="lg" onClick={() => setStep((s) => s - 1)} disabled={create.isPending}>
            {copy.action.back}
          </Button>
        ) : null}
        {step === 0 && !found && !photo ? (
          <Button variant="secondary" size="lg" className="flex-1" onClick={next}>
            {copy.action.skipPhoto}
          </Button>
        ) : null}
        {last ? (
          <Button type="submit" size="lg" className="flex-1" disabled={create.isPending} data-testid="report-submit">
            {copy.action.submit}
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={next} data-testid="report-next">
            {copy.action.next}
          </Button>
        )}
      </div>
    </form>
  );
}
