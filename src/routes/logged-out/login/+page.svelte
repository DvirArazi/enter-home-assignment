<script lang="ts">
  import { FloatingLabelInput, Button } from "flowbite-svelte";
  import type { PageProps } from "./$types";

  let { form }: PageProps = $props();
</script>

<div class="w-screen h-screen grid place-items-center">
  <form method="POST" class="max-w-125 p-4 flex flex-col gap-2">
    <h1>Teacher Log In</h1>

    <div class="flex gap-2">
        <FloatingLabelInput variant="outlined" name="name" required>
          Name
        </FloatingLabelInput>

      <FloatingLabelInput variant="outlined" name="idNumber" required>
        ID Number
      </FloatingLabelInput>
    </div>

    <Button color="blue" type="submit">Log In</Button>

    {#if form?.error}
      <p class="text-red-600 text-sm">{form.error}</p>
    {/if}
  </form>
</div>
