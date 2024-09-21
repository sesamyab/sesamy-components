<svelte:options customElement="sesamy-paywall" />

<script>
  import { CheckCircle2 } from "lucide-svelte";

  let selectedPlan = "sixMonths";

  const features = [
    "Allt material på Fokus.se",
    "Tillgång till e-tidning",
    "Tillgång till våra podcasts",
    "Nyhetsbrev",
  ];

  const paymentMethods = [
    "Visa",
    "American Express",
    "Mastercard",
    "Klarna",
    "Google Pay",
    "Apple Pay",
    "Swish",
  ];
</script>

<div class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
  <div class="text-right text-sm text-red-500 mb-4">
    Redan prenumerant? Logga in
  </div>

  <h1 class="text-4xl font-bold text-red-500 mb-4">FOKUS</h1>

  <h2 class="text-xl font-semibold mb-6">
    Läs Fokus Digital i 6 månader för bara 79 kr!
  </h2>

  <ul class="space-y-2 mb-6">
    {#each features as feature}
      <li class="flex items-center">
        <CheckCircle2 class="text-green-500 mr-2" size={20} />
        <span>{feature}</span>
      </li>
    {/each}
  </ul>

  <div class="space-y-4 mb-6">
    <label class="flex items-center p-4 border rounded-lg">
      <input
        type="radio"
        name="subscription"
        value="sixMonths"
        bind:group={selectedPlan}
        class="mr-3"
      />
      <div>
        <div class="font-semibold">Fokus Digital i 6 månader för 79kr!</div>
        <div class="text-sm text-gray-600">
          Efter kampanjperioden 149 kr/mån. Ingen bindningstid!
        </div>
      </div>
      <div class="ml-auto font-semibold">79 SEK/6 mån</div>
    </label>

    <label class="flex items-center p-4 border rounded-lg">
      <input
        type="radio"
        name="subscription"
        value="oneYear"
        bind:group={selectedPlan}
        class="mr-3"
      />
      <div>
        <div class="font-semibold">Fokus Digital i ett år för 995kr</div>
        <div class="text-sm text-gray-600">
          Du sparar 793 kr. Prenumerationen förnyas automatiskt årsvis.
        </div>
      </div>
      <div class="ml-auto font-semibold">995 SEK/år</div>
    </label>
  </div>

  <button class="w-full bg-red-500 text-white py-3 rounded-lg font-semibold">
    Fortsätt
  </button>

  <div class="text-center text-sm text-gray-600 mt-4">
    Säker SSL-krypterad betalning
  </div>

  <div class="flex justify-center space-x-2 mt-2">
    {#each paymentMethods as method}
      <img src="/api/placeholder/40/25" alt={method} class="h-6" />
    {/each}
  </div>
</div>
