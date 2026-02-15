<script lang="ts">
  import { A, Button, Card } from "flowbite-svelte";
  import { TrashBinSolid } from "flowbite-svelte-icons";
  import ConfirmModal from "$lib/components/ConfirmModal.svelte";
  import type { PageProps } from "./$types";

  const { data, form }: PageProps = $props();

  let isAddStudentModalOpen = $state(false);
  let isRemoveStudentModalOpen = $state(false);
  let selectedStudent = $state<{
    id: number;
    firstName: string;
    lastName: string;
  } | null>(null);

  const openAddStudentModal = () => {
    isAddStudentModalOpen = true;
  };

  const closeAddStudentModal = () => {
    isAddStudentModalOpen = false;
  };

  const openRemoveStudentModal = (student: {
    id: number;
    firstName: string;
    lastName: string;
  }) => {
    selectedStudent = student;
    isRemoveStudentModalOpen = true;
  };

  const closeRemoveStudentModal = () => {
    isRemoveStudentModalOpen = false;
    selectedStudent = null;
  };

  $effect(() => {
    if (form?.addStudentError) {
      isAddStudentModalOpen = true;
    }
  });
</script>

<Card size="xl" class="p-6">
  <div class="mb-5 flex items-center justify-between gap-3">
    <div>
      <h2 class="text-lg font-semibold text-slate-900">Students</h2>
      <p class="text-sm text-slate-600">
        {data.students.length} enrolled
      </p>
    </div>
    <Button color="blue" type="button" onclick={openAddStudentModal}>Add a Student</Button>
  </div>

  {#if form?.removeStudentError}
    <p class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {form.removeStudentError}
    </p>
  {/if}

  {#if data.students.length === 0}
    <div class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
      No students enrolled yet.
    </div>
  {:else}
    <div class="overflow-hidden rounded-lg border border-slate-200">
      <div class="grid grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)]">
        <div class="border-r border-slate-200">
          <table class="min-w-full table-fixed divide-y divide-slate-200">
            <thead>
              <tr class="h-10 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th class="align-middle px-1 py-0">Student</th>
                <th class="w-8 align-middle px-1 py-0 text-right"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each data.students as student}
                <tr class="h-16 hover:bg-slate-50">
                  <td class="align-middle px-1 py-0 text-sm text-slate-900">
                    <div class="truncate font-medium leading-tight">{student.firstName} {student.lastName}</div>
                    <div class="truncate text-xs text-slate-500">ID: {student.idNumber}</div>
                    <div class="truncate text-xs text-slate-500">Phone: {student.phoneNumber ?? "-"}</div>
                  </td>
                  <td class="align-middle px-1 py-0">
                    <div class="flex justify-end">
                      <Button
                        color="red"
                        size="xs"
                        type="button"
                        aria-label={`Remove ${student.firstName} ${student.lastName}`}
                        onclick={() => openRemoveStudentModal(student)}
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

        <div class="overflow-x-auto">
          <table class="min-w-max table-fixed divide-y divide-slate-200">
            <thead>
              <tr class="h-10 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {#if data.tasks.length === 0}
                  <th class="align-middle px-3 py-0">Tasks</th>
                {:else}
                  {#each data.tasks as task}
                    <th class="min-w-40 whitespace-nowrap align-middle px-3 py-0">
                      <A
                        href={`/registered/teacher/task-review/${task.id}`}
                        class="hover:text-blue-700 hover:underline"
                      >
                        {task.title}
                      </A>
                    </th>
                  {/each}
                {/if}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each data.students as student}
                <tr class="h-16 align-middle hover:bg-slate-50">
                  {#if data.tasks.length === 0}
                    <td class="align-middle whitespace-nowrap px-3 py-0 text-sm text-slate-500">No tasks yet</td>
                  {:else}
                    {#each student.taskStatuses as taskStatus}
                      <td class="align-middle min-w-40 whitespace-nowrap px-3 py-0 text-sm text-slate-700">
                        {#if taskStatus === "pending review"}
                          <span class="font-medium text-amber-700">pending review</span>
                        {:else if taskStatus === "not submitted"}
                          <span class="text-slate-500">not submitted</span>
                        {:else}
                          <span class="font-medium text-slate-900">{taskStatus}</span>
                        {/if}
                      </td>
                    {/each}
                  {/if}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}
</Card>

<ConfirmModal bind:open={isAddStudentModalOpen} title="Add Student">
  <p class="text-sm text-slate-700">Enter the student's ID number to enroll them in this classroom.</p>

  <form method="POST" action="?/addStudent" data-sveltekit-replacestate class="space-y-3">
    <div class="space-y-1">
      <label for="student-id-number" class="text-sm font-medium text-slate-700">ID Number</label>
      <input
        id="student-id-number"
        name="idNumber"
        required
        value={form?.addStudentValues?.idNumber ?? ""}
        class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 transition focus:ring-2"
      />
    </div>

    {#if form?.addStudentError}
      <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {form.addStudentError}
      </p>
    {/if}

    <div class="flex justify-end gap-2">
      <Button type="button" color="light" onclick={closeAddStudentModal}>Cancel</Button>
      <Button type="submit" color="blue">Add Student</Button>
    </div>
  </form>
</ConfirmModal>

<ConfirmModal bind:open={isRemoveStudentModalOpen} title="Remove Student">
  {#if selectedStudent}
    <p class="text-sm text-slate-700">
      Are you sure you want to remove
      <span class="font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</span>
      from this classroom?
    </p>

    <div class="flex justify-end gap-2">
      <Button type="button" color="light" onclick={closeRemoveStudentModal}>Cancel</Button>

      <form method="POST" action="?/removeStudent" data-sveltekit-replacestate>
        <input type="hidden" name="studentId" value={selectedStudent.id} />
        <Button color="red" type="submit">Remove</Button>
      </form>
    </div>
  {/if}
</ConfirmModal>
