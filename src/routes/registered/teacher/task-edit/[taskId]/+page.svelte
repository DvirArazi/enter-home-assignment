<script lang="ts">
  import {
    A,
    Button,
    Card,
    Datepicker,
    Fileupload,
    FloatingLabelInput,
    Label,
    Textarea,
  } from "flowbite-svelte";
  import type { PageProps } from "./$types";

  const { data, form }: PageProps = $props();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const parseSubmissionDateValue = (rawDate: string) => {
    const trimmed = rawDate.trim();

    if (!trimmed) {
      return undefined;
    }

    const createLocalDate = (year: number, month: number, day: number) => {
      const date = new Date(year, month - 1, day);

      if (
        date.getFullYear() !== year
        || date.getMonth() !== month - 1
        || date.getDate() !== day
      ) {
        return undefined;
      }

      return date;
    };

    const dayMonthYearMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);

    if (dayMonthYearMatch) {
      const [, dayRaw, monthRaw, yearRaw] = dayMonthYearMatch;
      return createLocalDate(Number(yearRaw), Number(monthRaw), Number(dayRaw));
    }

    const yearMonthDayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

    if (yearMonthDayMatch) {
      const [, yearRaw, monthRaw, dayRaw] = yearMonthDayMatch;
      return createLocalDate(Number(yearRaw), Number(monthRaw), Number(dayRaw));
    }

    return undefined;
  };

  const formatFileSize = (size: number | null) => {
    if (size === null) {
      return "";
    }

    if (size < 1024) {
      return `${size} B`;
    }

    const sizeInKb = size / 1024;

    if (sizeInKb < 1024) {
      return `${sizeInKb.toFixed(1)} KB`;
    }

    return `${(sizeInKb / 1024).toFixed(1)} MB`;
  };
</script>

<section class="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
  <Card size="xl" shadow="sm" class="rounded-xl border-slate-200 p-6">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-slate-900">Edit Task</h2>
      <p class="mt-1 text-sm text-slate-600">
        Update task details and save to return to classroom tasks.
      </p>
    </div>

    <form
      method="POST"
      action="?/save"
      enctype="multipart/form-data"
      data-sveltekit-replacestate
      class="space-y-5"
    >
      {#if form?.saveError}
        <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {form.saveError}
        </p>
      {/if}

      <FloatingLabelInput
        variant="outlined"
        name="title"
        value={form?.values?.title ?? data.task.title}
        required
      >
        Task Title
      </FloatingLabelInput>

      <Textarea
        name="instructions"
        rows={8}
        class="w-full"
        value={form?.values?.instructions ?? data.task.instructions}
        placeholder="Task instructions"
      />

      <div class="space-y-2">
        <Label for="files" class="text-sm font-medium text-slate-700">
          Attach Files
        </Label>
        <Fileupload
          id="files"
          name="files"
          multiple
          class="w-full"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx,.txt,.zip"
        />
        <p class="text-xs text-slate-500">You can select multiple files.</p>
      </div>

      {#if data.task.files.length > 0}
        <div class="space-y-2">
          <div class="text-sm font-medium text-slate-700">Current Files</div>
          <ul class="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            {#each data.task.files as file}
              <li class="flex items-center justify-between gap-2 text-sm">
                <A href={file.url} target="_blank" rel="noreferrer" class="truncate text-blue-700 hover:underline">
                  {file.name}
                </A>
                <span class="shrink-0 text-xs text-slate-500">{formatFileSize(file.size)}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      <div class="space-y-2">
        <Label for="submissionDate" class="text-sm font-medium text-slate-700">
          Submission Date
        </Label>
        <Datepicker
          value={parseSubmissionDateValue(form?.values?.submissionDate ?? data.task.submissionDate)}
          availableFrom={startOfToday}
          locale="en-GB"
          dateFormat={{ day: "2-digit", month: "2-digit", year: "numeric" }}
          placeholder="dd/mm/yyyy"
          required
          inputClass="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 transition focus:ring-2"
          inputProps={{ id: "submissionDate", name: "submissionDate" }}
        />
      </div>

      <div class="flex justify-end gap-2">
        <Button color="light" href={`/registered/teacher/classroom/${data.task.classroomId}/tasks`}>Back</Button>
        <Button color="blue" type="submit">Save</Button>
      </div>
    </form>
  </Card>
</section>
