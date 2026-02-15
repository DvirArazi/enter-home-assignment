<script lang="ts">
  import { A, Button, Card } from "flowbite-svelte";
  import { TrashBinSolid } from "flowbite-svelte-icons";
  import ConfirmModal from "$lib/components/ConfirmModal.svelte";
  import type { PageProps } from "./$types";

  const { data, form }: PageProps = $props();

  let isDeleteModalOpen = $state(false);
  let selectedTask = $state<{ id: number; title: string } | null>(null);

  const openDeleteModal = (task: { id: number; title: string }) => {
    selectedTask = task;
    isDeleteModalOpen = true;
  };

  const closeDeleteModal = () => {
    isDeleteModalOpen = false;
    selectedTask = null;
  };

  const formatSubmissionDate = (submissionDate: Date | string) => {
    const date =
      submissionDate instanceof Date
        ? submissionDate
        : new Date(submissionDate);

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };
</script>

<Card size="xl" class="p-6">
  <div class="mb-5 flex items-center justify-between gap-3">
    <div>
      <h2 class="text-lg font-semibold text-slate-900">Tasks</h2>
      <p class="text-sm text-slate-600">{data.tasks.length} total</p>
    </div>
    <form method="POST" action="?/createTask" data-sveltekit-replacestate>
      <Button color="blue" type="submit">New Task</Button>
    </form>
  </div>

  {#if form?.deleteError}
    <p
      class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {form.deleteError}
    </p>
  {/if}

  {#if data.tasks.length === 0}
    <div
      class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600"
    >
      No tasks yet. Create your first task.
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200">
        <thead>
          <tr
            class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            <th class="px-3 py-2">Title</th>
            <th class="px-3 py-2">Submission Date</th>
            <th class="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each data.tasks as task}
            <tr class="hover:bg-slate-50">
              <td class="px-3 py-3 text-sm font-medium text-slate-900"
                >{task.title}</td
              >
              <td class="whitespace-nowrap px-3 py-3 text-sm text-slate-700">
                {formatSubmissionDate(task.submissionDate)}
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center justify-end gap-2">
                  <A
                    class="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                    href={`/registered/teacher/task-edit/${task.id}`}
                  >
                    Edit
                  </A>
                  <A
                    class="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                    href={`/registered/teacher/task-review/${task.id}`}
                  >
                    Review
                  </A>
                  <Button
                    color="red"
                    type="button"
                    aria-label={`Delete task ${task.title}`}
                    onclick={() =>
                      openDeleteModal({ id: task.id, title: task.title })}
                  >
                    <TrashBinSolid />
                  </Button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</Card>

<ConfirmModal bind:open={isDeleteModalOpen} title="Delete Task">
  {#if selectedTask}
    <p class="text-sm text-slate-700">
      Are you sure you want to delete <span class="font-semibold"
        >{selectedTask.title}</span
      >? This action cannot be undone.
    </p>

    <div class="flex justify-end gap-2">
      <Button type="button" color="light" onclick={closeDeleteModal}
        >Cancel</Button
      >
      <form method="POST" action="?/deleteTask" data-sveltekit-replacestate>
        <input type="hidden" name="taskId" value={selectedTask.id} />
        <Button color="red" type="submit">Delete</Button>
      </form>
    </div>
  {/if}
</ConfirmModal>
