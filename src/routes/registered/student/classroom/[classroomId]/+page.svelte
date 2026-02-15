<script lang="ts">
  import { A, Button, Card } from "flowbite-svelte";
  import type { PageProps } from "./$types";

  const { data }: PageProps = $props();

  const formatDueDate = (dueDate: string) =>
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
    }).format(new Date(dueDate));

  const getTaskStatusLabel = (task: (typeof data.tasks)[number]) => {
    if (task.status === "graded") {
      return String(task.gradeScore);
    }

    if (task.status === "submitted") {
      return "submitted";
    }

    return `Due to ${formatDueDate(task.dueDate)}`;
  };
</script>

<section class="mx-auto w-full max-w-4xl space-y-4 px-4 py-6">
  <Card size="xl" class="p-6">
    <div class="mb-5 flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{data.classroom.name}</h1>
        <p class="text-sm text-slate-600">{data.tasks.length} task{data.tasks.length === 1 ? "" : "s"}</p>
      </div>
      <Button color="light" href="/registered/student">Back</Button>
    </div>

    {#if data.tasks.length === 0}
      <div class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
        No tasks in this classroom yet.
      </div>
    {:else}
      <div class="overflow-x-auto rounded-lg border border-slate-200">
        <table class="min-w-full divide-y divide-slate-200">
          <thead>
            <tr class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th class="px-3 py-2">Task</th>
              <th class="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each data.tasks as task}
              <tr class="hover:bg-slate-50">
                <td class="px-3 py-3 text-sm">
                  <A
                    href={`/registered/student/task/${task.id}`}
                    class="font-medium text-slate-800 hover:text-blue-700"
                  >
                    {task.title}
                  </A>
                </td>
                <td class="px-3 py-3 text-sm text-slate-700">
                  {#if task.status === "graded"}
                    <span class="font-medium text-slate-900">{getTaskStatusLabel(task)}</span>
                  {:else if task.status === "submitted"}
                    <span class="font-medium text-blue-700">{getTaskStatusLabel(task)}</span>
                  {:else}
                    <span>{getTaskStatusLabel(task)}</span>
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
