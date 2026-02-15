<script lang="ts">
  import { Button, Card, Fileupload, Label } from "flowbite-svelte";
  import type { PageProps } from "./$types";

  const { data, form }: PageProps = $props();

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
    }).format(new Date(date));

  const formatDateTime = (date: string) =>
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  const formatFileSize = (size: number | null) => {
    if (size === null) {
      return null;
    }

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };
</script>

<section class="mx-auto w-full max-w-4xl space-y-4 px-4 py-6">
  <Card size="xl" class="p-6">
    <div class="mb-5 space-y-1">
      <h1 class="text-2xl font-semibold text-slate-900">{data.task.title}</h1>
      <p class="text-sm text-slate-600">Due to {formatDate(data.task.submissionDate)}</p>
    </div>

    <div class="space-y-4">
      <section class="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">Instructions</h2>
        {#if data.task.instructions.trim()}
          <p class="whitespace-pre-wrap text-sm text-slate-800">{data.task.instructions}</p>
        {:else}
          <p class="text-sm text-slate-500">No instructions provided.</p>
        {/if}
      </section>

      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">Task Files</h2>
        {#if data.task.files.length === 0}
          <p class="text-sm text-slate-500">No files attached to this task.</p>
        {:else}
          <ul class="space-y-2">
            {#each data.task.files as file}
              <li class="text-sm text-slate-700">
                <a class="font-medium text-blue-700 hover:underline" href={file.url} target="_blank" rel="noreferrer">
                  {file.name}
                </a>
                {#if formatFileSize(file.size)}
                  <span class="text-slate-500"> ({formatFileSize(file.size)})</span>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      {#if data.submission}
        <section class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">Your Current Submission</h2>
          <p class="text-sm text-slate-700">
            Submitted at:
            {#if data.submission.submittedAt}
              {formatDateTime(data.submission.submittedAt)}
            {:else}
              not submitted yet
            {/if}
          </p>
          <p class="text-sm text-slate-700">
            Grade: {data.submission.gradeScore === null ? "Not graded yet" : data.submission.gradeScore}
          </p>
          {#if data.submission.files.length > 0}
            <ul class="mt-2 space-y-1">
              {#each data.submission.files as file}
                <li class="text-sm text-slate-700">
                  <a class="font-medium text-blue-700 hover:underline" href={file.url} target="_blank" rel="noreferrer">
                    {file.name}
                  </a>
                  {#if formatFileSize(file.size)}
                    <span class="text-slate-500"> ({formatFileSize(file.size)})</span>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </section>
      {/if}

      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">Submit Work</h2>

        <form
          method="POST"
          action="?/submit"
          enctype="multipart/form-data"
          data-sveltekit-replacestate
          class="space-y-3"
        >
          <div class="space-y-2">
            <Label for="submission-files" class="text-sm font-medium text-slate-700">Attach Files</Label>
            <Fileupload
              id="submission-files"
              name="files"
              multiple
              class="w-full"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx,.txt,.zip"
            />
            <p class="text-xs text-slate-500">You can select multiple files.</p>
          </div>

          {#if form?.submitError}
            <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {form.submitError}
            </p>
          {/if}

          <div class="flex justify-end gap-2">
            <Button color="light" href={`/registered/student/classroom/${data.task.classroomId}`}>Back</Button>
            <Button color="blue" type="submit">Submit</Button>
          </div>
        </form>
      </section>
    </div>
  </Card>
</section>
