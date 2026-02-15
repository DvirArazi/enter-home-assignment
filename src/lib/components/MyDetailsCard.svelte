<script lang="ts">
  import { Button, Card, FloatingLabelInput } from "flowbite-svelte";

  type UserDetails = {
    firstName: string;
    lastName: string;
    idNumber: string;
    phoneNumber: string | null;
  };

  type DetailsFormState = {
    detailsError?: string;
    detailsValues?: {
      firstName?: string;
      lastName?: string;
      idNumber?: string;
      phoneNumber?: string;
    };
  } | null | undefined;

  type Props = {
    userDetails: UserDetails;
    form?: DetailsFormState;
    action?: string;
    idPrefix?: string;
    title?: string;
    description?: string;
    submitLabel?: string;
  };

  let {
    userDetails,
    form = undefined,
    action = "?/updateDetails",
    idPrefix = "details",
    title = "My Details",
    description = "Keep your personal details up to date.",
    submitLabel = "Update Details",
  }: Props = $props();
</script>

<Card size="xl" class="p-6">
  <div class="mb-5">
    <h2 class="text-xl font-semibold text-slate-900">{title}</h2>
    <p class="mt-1 text-sm text-slate-600">{description}</p>
  </div>

  <form method="POST" {action} data-sveltekit-replacestate class="space-y-4">
    {#if form?.detailsError}
      <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {form.detailsError}
      </p>
    {/if}

    <div class="grid gap-3 md:grid-cols-2">
      <FloatingLabelInput
        id={`${idPrefix}-first-name`}
        variant="outlined"
        name="firstName"
        required
        value={form?.detailsValues?.firstName ?? userDetails.firstName}
      >
        First Name
      </FloatingLabelInput>

      <FloatingLabelInput
        id={`${idPrefix}-last-name`}
        variant="outlined"
        name="lastName"
        required
        value={form?.detailsValues?.lastName ?? userDetails.lastName}
      >
        Last Name
      </FloatingLabelInput>
    </div>

    <div class="grid gap-3 md:grid-cols-2">
      <FloatingLabelInput
        id={`${idPrefix}-id-number`}
        variant="outlined"
        name="idNumber"
        required
        value={form?.detailsValues?.idNumber ?? userDetails.idNumber}
      >
        ID Number
      </FloatingLabelInput>

      <FloatingLabelInput
        id={`${idPrefix}-phone-number`}
        variant="outlined"
        name="phoneNumber"
        type="tel"
        placeholder="+1 555 123 4567"
        value={form?.detailsValues?.phoneNumber ?? userDetails.phoneNumber ?? ""}
      >
        Phone Number
      </FloatingLabelInput>
    </div>

    <div class="flex justify-end">
      <Button color="blue" type="submit">{submitLabel}</Button>
    </div>
  </form>
</Card>
