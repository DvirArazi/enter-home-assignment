<script lang="ts">
  import { A, Button, Card } from "flowbite-svelte";
  import { TrashBinSolid } from "flowbite-svelte-icons";
  import ConfirmModal from "$lib/components/ConfirmModal.svelte";
  import MyDetailsCard from "$lib/components/MyDetailsCard.svelte";
  import type { PageProps } from "./$types";

  const { data, form }: PageProps = $props();

  let isDeleteModalOpen = $state(false);
  let selectedClassroom = $state<{ id: number; name: string } | null>(null);

  const openDeleteModal = (classroom: { id: number; name: string }) => {
    selectedClassroom = classroom;
    isDeleteModalOpen = true;
  };

  const closeDeleteModal = () => {
    isDeleteModalOpen = false;
    selectedClassroom = null;
  };
</script>

<section class="mx-auto w-full max-w-4xl space-y-4 px-4 py-6">
  <MyDetailsCard userDetails={data.userDetails} {form} idPrefix="teacher" />

  <Card size="xl" class="p-6">
    <div class="mb-5 flex items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold text-slate-900">My Classrooms</h1>
      <form method="POST" action="?/createClassroom" data-sveltekit-replacestate>
        <Button color="blue" type="submit">New Classroom</Button>
      </form>
    </div>

    {#if form?.deleteError}
      <p class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {form.deleteError}
      </p>
    {/if}

    {#if data.classrooms.length === 0}
      <div class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
        No classrooms yet. Create your first classroom.
      </div>
    {:else}
      <div class="space-y-2">
        {#each data.classrooms as classroom}
          <div class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
            <A
              href={`/registered/teacher/classroom/${classroom.id}/tasks`}
              class="min-w-0 truncate text-base font-medium text-slate-800 hover:text-blue-700"
            >
              {classroom.name}
            </A>

            <Button
              color="red"
              type="button"
              aria-label={`Delete classroom ${classroom.name}`}
              onclick={() => openDeleteModal({ id: classroom.id, name: classroom.name })}
            >
              <TrashBinSolid />
            </Button>
          </div>
        {/each}
      </div>
    {/if}
  </Card>
</section>

<ConfirmModal bind:open={isDeleteModalOpen} title="Delete Classroom">
  {#if selectedClassroom}
    <p class="text-sm text-slate-700">
      Are you sure you want to delete <span class="font-semibold">{selectedClassroom.name}</span>?
      This action cannot be undone.
    </p>

    <div class="flex justify-end gap-2">
      <Button type="button" color="light" onclick={closeDeleteModal}>Cancel</Button>

      <form method="POST" action="?/deleteClassroom" data-sveltekit-replacestate>
        <input type="hidden" name="classroomId" value={selectedClassroom.id} />
        <Button color="red" type="submit">Delete</Button>
      </form>
    </div>
  {/if}
</ConfirmModal>
