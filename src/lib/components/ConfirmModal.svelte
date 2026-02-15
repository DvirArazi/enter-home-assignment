<script lang="ts">
  import { Card } from "flowbite-svelte";
  import { CloseOutline } from "flowbite-svelte-icons";
  import type { Snippet } from "svelte";

  let {
    open = $bindable(false),
    title = "Confirm",
    children,
  }: {
    open?: boolean;
    title?: string;
    children?: Snippet;
  } = $props();

  const close = () => {
    open = false;
  };

  const onBackdropClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      close();
    }
  };
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
    role="presentation"
    onclick={onBackdropClick}
  >
    <Card
      shadow="2xl"
      role="dialog"
      aria-modal="true"
      class="max-w-md rounded-xl border-slate-200 p-5"
    >
      <div class="mb-3 flex items-center justify-between gap-3">
        <h3 class="text-lg font-semibold text-slate-900">{title}</h3>
        <button
          type="button"
          class="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
          onclick={close}
        >
          <CloseOutline size="sm" />
        </button>
      </div>

      <div class="space-y-4">
        {@render children?.()}
      </div>
    </Card>
  </div>
{/if}
