<script lang="ts">
  import { A, Button, Card, FloatingLabelInput } from "flowbite-svelte";
  import { TrashBinSolid } from "flowbite-svelte-icons";
  import ConfirmModal from "$lib/components/ConfirmModal.svelte";
  import MyDetailsCard from "$lib/components/MyDetailsCard.svelte";
  import type { PageProps } from "./$types";

  const { data, form }: PageProps = $props();

  let isJoinModalOpen = $state(false);
  let isLeaveModalOpen = $state(false);
  let selectedClassroom = $state<{ id: number; name: string } | null>(null);

  const openJoinModal = () => {
    isJoinModalOpen = true;
  };

  const closeJoinModal = () => {
    isJoinModalOpen = false;
  };

  const openLeaveModal = (classroom: { id: number; name: string }) => {
    selectedClassroom = classroom;
    isLeaveModalOpen = true;
  };

  const closeLeaveModal = () => {
    isLeaveModalOpen = false;
    selectedClassroom = null;
  };

  $effect(() => {
    if (form?.joinClassroomError) {
      isJoinModalOpen = true;
    }
  });
</script>

<section class="mx-auto w-full max-w-4xl space-y-4 px-4 py-6">
  <MyDetailsCard userDetails={data.userDetails} {form} idPrefix="student" />

  <Card size="xl" class="p-6">
    <div class="mb-5 flex items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold text-slate-900">My Classrooms</h1>
      <Button color="blue" type="button" onclick={openJoinModal}>Join a New Classroom</Button>
    </div>

    {#if form?.leaveClassroomError}
      <p class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {form.leaveClassroomError}
      </p>
    {/if}

    {#if data.classrooms.length === 0}
      <div class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
        You are not enrolled in any classrooms yet.
      </div>
    {:else}
      <div class="space-y-2">
        {#each data.classrooms as classroom}
          <div class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
            <A
              href={`/registered/student/classroom/${classroom.id}`}
              class="min-w-0 truncate text-base font-medium text-slate-800 hover:text-blue-700"
            >
              {classroom.name}
            </A>
            <Button
              color="red"
              type="button"
              aria-label={`Leave classroom ${classroom.name}`}
              onclick={() => openLeaveModal({ id: classroom.id, name: classroom.name })}
            >
              <TrashBinSolid />
            </Button>
          </div>
        {/each}
      </div>
    {/if}
  </Card>
</section>

<ConfirmModal bind:open={isJoinModalOpen} title="Join Classroom">
  <p class="text-sm text-slate-700">Enter a classroom code to join.</p>

  <form method="POST" action="?/joinClassroom" data-sveltekit-replacestate class="space-y-3">
    <FloatingLabelInput
      id="classroom-code"
      variant="outlined"
      name="code"
      required
      maxlength={7}
      value={form?.joinClassroomValues?.code ?? ""}
      inputClass="font-mono uppercase tracking-widest"
    >
      Classroom Code
    </FloatingLabelInput>

    {#if form?.joinClassroomError}
      <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {form.joinClassroomError}
      </p>
    {/if}

    <div class="flex justify-end gap-2">
      <Button type="button" color="light" onclick={closeJoinModal}>Cancel</Button>
      <Button type="submit" color="blue">Join Classroom</Button>
    </div>
  </form>
</ConfirmModal>

<ConfirmModal bind:open={isLeaveModalOpen} title="Leave Classroom">
  {#if selectedClassroom}
    <p class="text-sm text-slate-700">
      Are you sure you want to leave
      <span class="font-semibold">{selectedClassroom.name}</span>?
    </p>

    <div class="flex justify-end gap-2">
      <Button type="button" color="light" onclick={closeLeaveModal}>Cancel</Button>

      <form method="POST" action="?/leaveClassroom" data-sveltekit-replacestate>
        <input type="hidden" name="classroomId" value={selectedClassroom.id} />
        <Button color="red" type="submit">Leave Classroom</Button>
      </form>
    </div>
  {/if}
</ConfirmModal>
