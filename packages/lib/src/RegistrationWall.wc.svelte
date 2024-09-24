<svelte:options customElement="sesamy-registration-wall" />

<script lang="ts">
  import AppleLogo from "./assets/AppleLogo.svelte";
  import FacebookLogo from "./assets/FacebookLogo.svelte";
  import GoogleLogo from "./assets/GoogleLogo.svelte";

  function handleClick() {
    console.log("Button clicked");
  }
</script>

<div class="registration-wall">
  <slot name="title"><h1>Skapa ett gratis konto eller logga in</h1></slot>
  <slot name="description">
    <p>Få tillgång till gratis artiklar och nyhetsbrev.</p>
  </slot>

  <div class="form-container">
    <input type="email" id="email" placeholder="Skriv in din epost" />

    <button part="continueButton" class="continue-button" on:click={handleClick}
      >Fortsätt</button
    >

    <div class="divider">eller</div>

    <button on:click={handleClick} class="social-button google">
      <span class="button-content">
        <GoogleLogo width="18" height="18" />
        <span class="button-text">Fortsätt med Google</span>
      </span>
    </button>

    <button on:click={handleClick} class="social-button facebook">
      <span class="button-content">
        <FacebookLogo width="18" height="18" />
        <span class="button-text">Fortsätt med Facebook</span>
      </span>
    </button>

    <button on:click={handleClick} class="social-button apple">
      <span class="button-content">
        <AppleLogo width="18" height="18" />
        <span class="button-text">Fortsätt med Apple</span>
      </span>
    </button>
  </div>

  <p class="terms">
    Genom att logga in godkänner du våra <a href="#terms">Vilkor</a>
  </p>
</div>

<style>
  .registration-wall {
    font-family: Arial, sans-serif;
    max-width: 500px;
    margin: 0 auto;
    padding: 20px;
    text-align: center;
    background-color: rgb(248, 248, 245);
    border: solid 1px #e9e9da;
    border-radius: 8px;
  }

  h1 {
    font-size: 24px;
    margin-bottom: 10px;
  }

  p {
    font-size: 14px;
    margin-bottom: 20px;
    color: #555;
  }

  .form-container {
    width: 100%;
  }

  input {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
  }

  .continue-button {
    width: 100%;
    padding: 10px;
    background-color: #4285f4;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 10px;
    font-size: 14px;
  }

  .divider {
    margin: 15px 0;
    text-align: center;
    position: relative;
    color: #777;
  }

  .divider::before,
  .divider::after {
    content: "";
    position: absolute;
    top: 50%;
    width: 45%;
    height: 1px;
    background-color: #ccc;
  }

  .divider::before {
    left: 0;
  }

  .divider::after {
    right: 0;
  }

  .social-button {
    width: 100%;
    padding: 10px;
    background-color: #fff;
    color: #000;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 10px;
    font-size: 14px;
    display: flex;
    justify-content: center;
  }

  .button-content {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .button-content :global(svg) {
    margin-right: 8px;
  }

  .terms {
    font-size: 12px;
    margin-top: 20px;
    color: #777;
  }

  a {
    color: #4285f4;
    text-decoration: none;
  }
</style>
