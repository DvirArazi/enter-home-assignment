<script lang="ts">
  import type { PageData } from "./$types";
  import { FloatingLabelInput } from "flowbite-svelte";

  let { data } = $props<{ data: PageData }>();
</script>

<section class="p-4 space-y-4">
  <h1 class="text-center text-2xl font-semibold">Students</h1>

  {#if data.students.length === 0}
    <p class="text-slate-600">No students yet.</p>
  {:else}
    <div class="grid gap-3 sm:grid-cols-2">
      {#each data.students as student}
        <form
          method="POST"
          action="?/update"
          class="rounded-2xl border bg-white p-4 shadow-sm space-y-3"
        >
          <input type="hidden" name="id" value={student.id} />

          <FloatingLabelInput
            variant="outlined"
            name="name"
            value={student.name}
            required
          >
            Name
          </FloatingLabelInput>

          <FloatingLabelInput
            variant="outlined"
            name="class"
            value={student.class}
            required
          >
            Class
          </FloatingLabelInput>

          <FloatingLabelInput
            variant="outlined"
            name="phone_number"
            value={student.phoneNumber}
            required
          >
            Phone Number
          </FloatingLabelInput>

          <div class="flex justify-end">
            <button
              type="submit"
              class="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      {/each}
    </div>
  {/if}
</section>
