<script lang="ts">
  import { Button, Card } from "flowbite-svelte";
  import {
    CheckOutline,
    CloseOutline,
    EditOutline,
  } from "flowbite-svelte-icons";
  import type { PageProps } from "./$types";

  const { data, form }: PageProps = $props();

  let isEditingName = $state(false);
  let draftName = $state("");

  const getGradeInputValue = (submission: (typeof data.submissions)[number]) => {
    if (form?.gradeValues?.submissionId === String(submission.submissionId ?? "")) {
      return form.gradeValues.grade;
    }

    if (submission.gradeScore !== null) {
      return String(submission.gradeScore);
    }

    return "";
  };

  const hasGradeErrorForSubmission = (submission: (typeof data.submissions)[number]) =>
    form?.gradeValues?.submissionId === String(submission.submissionId ?? "");

  const formatSubmittedAt = (submittedAt: string | null) => {
    if (!submittedAt) {
      return "Not submitted";
    }

    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(submittedAt));
  };

  const startEditingName = () => {
    draftName = data.task.title;
    isEditingName = true;
  };

  const cancelEditingName = () => {
    draftName = data.task.title;
    isEditingName = false;
  };

  $effect(() => {
    data.task.title;
    draftName = form?.renameTaskValues?.title ?? data.task.title;
    isEditingName = Boolean(form?.renameTaskError);
  });
</script>

<section class="mx-auto w-full max-w-6xl px-4 py-6">
  <Card size="xl" class="p-6">
    <div class="mb-5 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        {#if isEditingName}
          <form
            method="POST"
            action="?/renameTask"
            data-sveltekit-replacestate
            class="flex min-w-0 flex-1 items-center gap-2"
          >
            <input
              type="text"
              name="title"
              bind:value={draftName}
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-lg font-semibold text-slate-900 outline-none ring-blue-500 transition focus:ring-2"
              aria-label="Task name"
            />
            <Button type="submit" color="light" aria-label="Save task name">
              <CheckOutline />
            </Button>
            <Button
              type="button"
              color="light"
              aria-label="Cancel task name editing"
              onclick={cancelEditingName}
            >
              <CloseOutline />
            </Button>
          </form>
        {:else}
          <div class="flex min-w-0 flex-1 items-center gap-2">
            <h2 class="truncate text-xl font-semibold text-slate-900 md:text-2xl">
              {data.task.title}
            </h2>
            <Button
              type="button"
              color="light"
              aria-label="Edit task name"
              onclick={startEditingName}
            >
              <EditOutline />
            </Button>
          </div>
        {/if}
        <Button color="light" href={`/registered/teacher/classroom/${data.task.classroomId}/tasks`}>Back</Button>
      </div>

      <p class="text-sm text-slate-600">
        Submissions for {data.submissions.length} student{data.submissions
          .length === 1
          ? ""
          : "s"}
      </p>

      {#if form?.renameTaskError}
        <p
          class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {form.renameTaskError}
        </p>
      {/if}

      {#if form?.gradeError && !form?.gradeValues?.submissionId}
        <p
          class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {form.gradeError}
        </p>
      {/if}
    </div>

    {#if data.submissions.length === 0}
      <div
        class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600"
      >
        No students enrolled in this classroom yet.
      </div>
    {:else}
      <div class="overflow-x-auto rounded-lg border border-slate-200">
        <table class="min-w-full divide-y divide-slate-200">
          <thead>
            <tr
              class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              <th class="px-3 py-2">Student</th>
              <th class="px-3 py-2">Submitted at</th>
              <th class="px-3 py-2">Submitted files</th>
              <th class="px-3 py-2">Grade</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each data.submissions as submission}
              <tr class="align-top hover:bg-slate-50">
                <td class="px-3 py-3 text-sm text-slate-900">
                  <div class="font-medium">{submission.studentName}</div>
                  <div class="text-xs text-slate-500">{submission.idNumber}</div>
                </td>
                <td class="whitespace-nowrap px-3 py-3 text-sm text-slate-700">
                  {formatSubmittedAt(submission.submittedAt)}
                </td>
                <td class="px-3 py-3 text-sm text-slate-700">
                  {#if submission.submittedAt === null || submission.files.length === 0}
                    <span class="text-slate-500">-</span>
                  {:else}
                    <ul class="space-y-1">
                      {#each submission.files as file}
                        <li>
                          <a
                            class="text-blue-700 hover:underline"
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {file.name}
                          </a>
                        </li>
                      {/each}
                    </ul>
                  {/if}
                </td>
                <td class="px-3 py-3 text-sm text-slate-700">
                  {#if submission.submittedAt === null || submission.submissionId === null}
                    <span class="whitespace-nowrap text-slate-500">-</span>
                  {:else}
                    <form
                      method="POST"
                      action="?/updateGrade"
                      data-sveltekit-replacestate
                      class="flex items-center gap-2"
                    >
                      <input type="hidden" name="submissionId" value={submission.submissionId} />
                      <input
                        type="number"
                        name="grade"
                        min="0"
                        max="100"
                        step="1"
                        required
                        value={getGradeInputValue(submission)}
                        class="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 outline-none ring-blue-500 transition focus:ring-2"
                      />
                      <Button color="light" type="submit">Save</Button>
                    </form>
                    {#if form?.gradeError && hasGradeErrorForSubmission(submission)}
                      <p class="mt-1 text-xs text-red-700">{form.gradeError}</p>
                    {/if}
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </Card>
</section>
