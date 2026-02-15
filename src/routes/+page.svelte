<script lang="ts">
  import { FloatingLabelInput, Radio, Button, Card } from "flowbite-svelte";
  import type { PageProps } from "./$types";

  let { form }: PageProps = $props();
  let userType = $state<"teacher" | "student">("teacher");
</script>

<div class="flex min-h-screen items-center justify-center px-4">
  <div class="flex w-full max-w-5xl flex-col gap-8">
    <h1 class="text-center text-5xl font-bold">Welcome to Taskit</h1>
    <div
      class="mx-auto flex w-full max-w-md flex-col gap-8 md:w-fit md:max-w-none md:flex-row md:items-start md:gap-12"
    >
      <form method="POST" action="?/signup" data-sveltekit-replacestate>
        <Card class="space-y-4 p-4 sm:p-6 w-full md:w-md">
          <h2 class="text-2xl font-semibold">Sign Up</h2>
          {#if form?.signupError}
            <p class="text-sm text-red-600">{form.signupError}</p>
          {/if}
          <FloatingLabelInput
            variant="outlined"
            name="firstName"
            value={form?.signupValues?.firstName ?? ""}
            required
          >
            First Name
          </FloatingLabelInput>
          <FloatingLabelInput
            variant="outlined"
            name="lastName"
            value={form?.signupValues?.lastName ?? ""}
            required
          >
            Last Name
          </FloatingLabelInput>
          <FloatingLabelInput
            variant="outlined"
            name="idNumber"
            value={form?.signupValues?.idNumber ?? ""}
            required
          >
            ID Number
          </FloatingLabelInput>
          <FloatingLabelInput
            variant="outlined"
            name="password"
            type="password"
            autocomplete="new-password"
            required
          >
            Password
          </FloatingLabelInput>
          <FloatingLabelInput
            variant="outlined"
            name="confirmPassword"
            type="password"
            autocomplete="new-password"
            required
          >
            Confirm Password
          </FloatingLabelInput>
          <div class="space-y-2">
            <Radio name="role" value="teacher" bind:group={userType}
              >I'm a teacher</Radio
            >
            <Radio name="role" value="student" bind:group={userType}
              >I'm a student</Radio
            >
          </div>
          <div class="flex justify-end gap-2">
            <Button color="blue" type="submit">Submit</Button>
          </div>
        </Card>
      </form>
      <form method="POST" action="?/login" data-sveltekit-replacestate>
        <Card class="space-y-4 p-4 sm:p-6 w-full md:w-md">
          <h2 class="text-2xl font-semibold">Log In</h2>
          {#if form?.loginError}
            <p class="text-sm text-red-600">{form.loginError}</p>
          {/if}
          <FloatingLabelInput
            variant="outlined"
            name="loginIdNumber"
            value={form?.loginValues?.idNumber ?? ""}
            required
          >
            ID Number
          </FloatingLabelInput>
          <FloatingLabelInput
            variant="outlined"
            type="password"
            name="loginPassword"
            autocomplete="current-password"
            required
          >
            Password
          </FloatingLabelInput>
          <div class="flex justify-end gap-2">
            <Button color="blue" type="submit">Submit</Button>
          </div>
        </Card>
      </form>
    </div>
  </div>
</div>
