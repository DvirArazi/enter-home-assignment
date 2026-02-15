<script lang="ts">
  import type { LayoutProps } from "./$types";
  import { page } from "$app/state";
  import { A, Button, Card } from "flowbite-svelte";
  import ConfirmModal from "$lib/components/ConfirmModal.svelte";
  import {
    CheckOutline,
    CloseOutline,
    EditOutline,
  } from "flowbite-svelte-icons";

  let { data, children }: LayoutProps = $props();
  let isEditingName = $state(false);
  let isCodeModalOpen = $state(false);
  let draftName = $state("");

  const activeTab = (path: "tasks" | "students") =>
    page.url.pathname.endsWith(`/${path}`)
      ? "rounded-md bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-700"
      : "rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900";

  $effect(() => {
    data.classroom.id;
    draftName = data.classroom.name;
    isEditingName = false;
    isCodeModalOpen = false;
  });

  const startEditingName = () => {
    draftName = data.classroom.name;
    isEditingName = true;
  };

  const cancelEditingName = () => {
    draftName = data.classroom.name;
    isEditingName = false;
  };
</script>

<section class="mx-auto w-full max-w-6xl space-y-4 px-4 py-6">
  <Card size="xl" shadow="sm" class="rounded-xl border-slate-200 p-4">
    <div
      class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
      {#if isEditingName}
        <form
          method="POST"
          action={`/registered/teacher/classroom/${data.classroom.id}/rename`}
          data-sveltekit-replacestate
          class="flex w-full max-w-2xl items-center gap-2"
        >
          <input type="hidden" name="returnTo" value={page.url.pathname} />
          <input
            type="text"
            name="name"
            bind:value={draftName}
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-lg font-semibold text-slate-900 outline-none ring-blue-500 transition focus:ring-2"
            aria-label="Classroom name"
          />
          <Button type="submit" color="light" aria-label="Save classroom name">
            <CheckOutline />
          </Button>
          <Button
            type="button"
            color="light"
            aria-label="Cancel classroom name editing"
            onclick={cancelEditingName}
          >
            <CloseOutline />
          </Button>
        </form>
      {:else}
        <div class="w-full max-w-2xl">
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-semibold text-slate-900 md:text-2xl">
              {data.classroom.name}
            </h1>
            <Button
              type="button"
              color="light"
              aria-label="Edit classroom name"
              onclick={startEditingName}
            >
              <EditOutline />
            </Button>
            <Button
              type="button"
              color="light"
              onclick={() => (isCodeModalOpen = true)}
            >
              View Code
            </Button>
          </div>
        </div>
      {/if}
      <div class="flex items-center gap-8">
        <nav class="flex gap-2">
          <A
            href={`/registered/teacher/classroom/${data.classroom.id}/tasks`}
            class={activeTab("tasks")}
          >
            Tasks
          </A>
          <A
            href={`/registered/teacher/classroom/${data.classroom.id}/students`}
            class={activeTab("students")}
          >
            Students
          </A>
        </nav>

        <Button color="light" href="/registered/teacher">Back</Button>
      </div>
    </div>
  </Card>

  {@render children()}
</section>

<ConfirmModal bind:open={isCodeModalOpen} title="Classroom Code">
  <div class="py-2 text-center">
    <div
      class="mt-3 font-mono text-5xl font-black tracking-[0.25em] text-slate-900 sm:text-6xl md:text-7xl"
    >
      {data.classroom.code}
    </div>
  </div>
</ConfirmModal>
