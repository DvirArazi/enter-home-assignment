<script lang="ts">
  import { Button } from "flowbite-svelte";
  import type { LayoutProps } from "./$types";

  const { children, data }: LayoutProps = $props();
</script>

<div class="border-b border-slate-200 bg-white">
  <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
    <nav class="flex items-center text-sm text-slate-700" aria-label="Breadcrumb">
      {#each data.breadcrumbs as crumb, index}
        {#if index > 0}
          <span class="mx-2 text-slate-400">&gt;</span>
        {/if}

        {#if crumb.href}
          <a href={crumb.href} class="font-medium text-slate-700 hover:text-blue-700">
            {crumb.label}
          </a>
        {:else}
          <span class="font-medium text-slate-900">{crumb.label}</span>
        {/if}
      {/each}
    </nav>

    <div class="flex items-center gap-4">
      <div class="text-sm text-slate-600">Hello, {data.user.firstName}</div>
      <form method="POST" action="/registered/logout" data-sveltekit-replacestate>
        <Button color="light" type="submit">Log Out</Button>
      </form>
    </div>
  </div>
</div>

{@render children()}
