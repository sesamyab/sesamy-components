<svelte:options customElement="sesamy-paywall" />

<script lang="ts">
  import Base from './Base.svelte';
  import Card from './components/Card.svelte';
  import PurchaseOption from './components/PurchaseOption.svelte';
  import Column from './components/Column.svelte';
  import Icon from './components/Icon.svelte';
  import PaymentMethod from './components/PaymentMethod.svelte';
  import Row from './components/Row.svelte';
  import Button from './components/Button.svelte';
  import type { IconName } from './icons/types';

  const features = [
    'Allt material på Fokus.se',
    'Tillgång till e-tidning',
    'Tillgång till våra podcasts',
    'Nyhetsbrev'
  ];

  const paymentMethods = [
    'visa',
    'apple-pay',
    'google-pay',
    'klarna',
    'amex',
    'mastercard',
    'vipps',
    'swish'
  ] as IconName[];
</script>

<Base>
  <Column
    class="w-full shadow-lg pt-6 bg-gradient-to-b from-[var(--s-bg-color,purple)] rounded-3xl to-[#F8EEEE]"
  >
    <Row class="text-xs gap-1 pt-2">
      Redan prenumerant? <a href="/" class="text-[var(--s-main-color,purple)]">
        Logga in för att läsa
      </a>
    </Row>

    <Column class="gap-4 px-16 pb-16 pt-10 w-full" up left>
      <Icon class="text-[120px] text-[var(--s-main-color,purple)] font-bold" name="fokus" />
      <div class="text-3xl mt-4">Läs Fokus Digital i 6 månader för bara 79kr!</div>

      <ul class="text-black column-left gap-0.5">
        {#each features as feature}
          <li class="row-left gap-2">
            <Icon class="text-xs text-[var(--s-main-color,purple)]" name="checkmark" />
            <span class="font-medium">{feature}</span>
          </li>
        {/each}
      </ul>

      <Card class="mt-4">
        <PurchaseOption id="one" name="purchase-option">
          <Column left>
            <div class="text-base font-medium">Fokus Premium (Digital + Tidning)</div>
          </Column>
          <div class="text-base font-medium">225 kr/månad</div>
        </PurchaseOption>
        <hr class="w-full border-gray-100" />
        <PurchaseOption id="two" name="purchase-option">
          <Column left>
            <div class="text-base font-medium">Fokus Digital</div>
          </Column>
          <div class="text-base font-medium">149 kr/månad</div>
        </PurchaseOption>
      </Card>

      <Card>
        <PurchaseOption id="three" name="purchase-option">
          <Column left>
            <div class="text-base font-medium">Lås upp artikeln</div>
            <div class="text-sm">
              Betala snabbt och smidigt med och få tillgång til artikeln direkt.
            </div>
          </Column>
          <div class="text-base font-medium">19 kr</div>
        </PurchaseOption>
      </Card>

      <Button class="mt-2" onclick={() => alert('continue')}>Continue</Button>

      <Row class="!justify-between w-full mt-8">
        <Row class="gap-2 text-[#5F6D85] text-xs">
          <Icon name="lock" />Säker SSL-krypterad betalning
        </Row>
        <Row class="gap-2">
          {#each paymentMethods as paymentMethod}
            <PaymentMethod name={paymentMethod} />
          {/each}
        </Row>
      </Row>
    </Column>
  </Column>
</Base>
