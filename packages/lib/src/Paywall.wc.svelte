<svelte:options customElement="sesamy-paywall" />

<script lang="ts">
  import Base from './Base.svelte';
  import Row from './components/Row.svelte';

  let selectedPlan = 'sixMonths';

  const features = [
    'Allt material på Fokus.se',
    'Tillgång till e-tidning',
    'Tillgång till våra podcasts',
    'Nyhetsbrev'
  ];

  const paymentMethods = [
    'Visa',
    'American Express',
    'Mastercard',
    'Klarna',
    'Google Pay',
    'Apple Pay',
    'Swish'
  ];
</script>

<Base>
  <Row class="w-full" left>asd</Row>
</Base>
