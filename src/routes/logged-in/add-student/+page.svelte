<script lang="ts">
  import { FloatingLabelInput, Button } from "flowbite-svelte";
</script>

<section class="p-4 space-y-4">
  
  <h1 class="text-center text-2xl font-semibold">Add a Student</h1>

  <div class="grid place-items-center">
    <form method="POST" class="max-w-100 p-4 flex flex-col gap-2">

      <div class="flex flex-col gap-2">
        <FloatingLabelInput variant="outlined" name="name" required>
          Name
        </FloatingLabelInput>

        <FloatingLabelInput variant="outlined" name="class" required>
          Class
        </FloatingLabelInput>

        <FloatingLabelInput variant="outlined" name="phone_number" required>
          Phone Number
        </FloatingLabelInput>
      </div>

      <Button color="blue" type="submit">Add</Button>
    </form>
  </div>
</section>
