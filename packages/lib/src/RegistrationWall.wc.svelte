<svelte:options customElement="sesamy-registration-wall" />

<script lang="ts">
  import { createEventDispatcher } from "svelte";

  type SocialProvider = "google" | "facebook" | "apple";

  const dispatch = createEventDispatcher<{
    continue: { email: string };
    socialLogin: { provider: SocialProvider };
    workSchoolLogin: void;
    subscriptionOptions: void;
  }>();

  let email = "";

  function handleContinue() {
    dispatch("continue", { email });
  }

  function handleSocialLogin(provider: SocialProvider) {
    dispatch("socialLogin", { provider });
  }

  function handleWorkSchoolLogin() {
    dispatch("workSchoolLogin");
  }

  function handleSubscriptionOptions() {
    dispatch("subscriptionOptions");
  }
</script>

<div class="registration-wall">
  <h1>Create a free account, or log in.</h1>
  <p>
    Gain access to limited free articles, news alerts, select newsletters,
    podcasts and some daily games.
  </p>

  <label for="email">Email Address</label>
  <input
    type="email"
    id="email"
    bind:value={email}
    placeholder="Enter your email"
  />

  <button on:click={handleContinue}>Continue</button>

  <div class="divider">or</div>

  <p class="terms">
    By continuing, you agree to the <a href="#terms">Terms of Sale</a>,
    <a href="#service">Terms of Service</a>, and
    <a href="#privacy">Privacy Policy</a>.
  </p>

  <button
    on:click={() => handleSocialLogin("google")}
    class="social-button google"
  >
    Continue with Google
  </button>

  <button
    on:click={() => handleSocialLogin("facebook")}
    class="social-button facebook"
  >
    Continue with Facebook
  </button>

  <button
    on:click={() => handleSocialLogin("apple")}
    class="social-button apple"
  >
    Continue with Apple
  </button>

  <a href="#" on:click={handleWorkSchoolLogin}
    >Continue with work or school single sign-on &gt;</a
  >

  <p>Enjoy unlimited access to all of The Times.</p>
  <button on:click={handleSubscriptionOptions}>See subscription options</button>
</div>

<style>
  .registration-wall {
    font-family: Arial, sans-serif;
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
    text-align: center;
  }

  h1 {
    font-size: 24px;
    margin-bottom: 10px;
  }

  p {
    font-size: 16px;
    margin-bottom: 20px;
  }

  input {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  button {
    width: 100%;
    padding: 10px;
    background-color: #000;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 10px;
  }

  .divider {
    margin: 20px 0;
    text-align: center;
    position: relative;
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
    background-color: #fff;
    color: #000;
    border: 1px solid #ccc;
  }

  a {
    color: #000;
    text-decoration: none;
  }

  .terms {
    font-size: 12px;
    margin-bottom: 20px;
  }
</style>
