<script lang="ts">
  import { page } from "$app/state";

  let { children } = $props();

  const navLinks = [
    { href: "/logged-in/students", label: "Students" },
    { href: "/logged-in/add-student", label: "Add student" }
  ] as const;

  const pathname = $derived(page.url.pathname);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
</script>

<div class="min-h-screen text-slate-900">
  <header class="border-b bg-white">
    <div class="mx-auto flex max-w-5xl items-center justify-between gap-4 p-4">
      <nav class="flex items-center gap-2">
        {#each navLinks as link}
          <a
            href={link.href}
            class={`rounded px-3 py-2 text-sm font-medium transition-colors ${
              isActive(link.href) ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"
            }`}
            aria-current={isActive(link.href) ? "page" : undefined}
          >
            {link.label}
          </a>
        {/each}
      </nav>

      <form method="POST" action="/logged-in/logout">
        <button
          type="submit"
          class="rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Log out
        </button>
      </form>
    </div>
  </header>

  <main class="mx-auto max-w-5xl p-4">
    {@render children()}
  </main>
</div>
