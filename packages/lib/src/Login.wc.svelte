<svelte:options customElement="sesamy-login" />

<script lang="ts">
  import Base from "./Base.svelte";
  import Button from "./Button.wc.svelte";
  import type { Api } from "./api";

  let loading = false;
  let loggedIn = false;
  let userAvatar = null;

  const login = async (api: Api) => {
    loading = true;
    try {
      await api.auth.loginWithRedirect();
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      loading = false;
    }
  };

  const logout = async (api: Api) => {
    loading = true;
    try {
      await api.auth.logout();
      loggedIn = false;
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const checkLoggedIn = async (api: Api) => {
    try {
      loggedIn = await api.auth.isAuthenticated();
      if (loggedIn) {
        const user = await api.auth.getUser();
        userAvatar = user.picture || userAvatar;
      }
    } catch (error) {
      console.error("Error checking login status:", error);
    }
  };
</script>

<Base let:api>
  {#await checkLoggedIn(api) then _}
    {#if loading}
      <!-- Loading State -->
      <button class="loading-btn" aria-busy="true" aria-label="Logging in">
        <!-- Pulsating animation for loading state -->
      </button>
    {:else if loggedIn}
      <button
        class="avatar-btn"
        onclick={() => logout(api)}
        aria-label="Log out"
      >
        <img src={userAvatar} alt="User Avatar" />
      </button>
    {:else}
      <slot name="loginButton">
        <Button
          part="loginButton"
          {loading}
          class="login-btn"
          onclick={() => login(api)}
          aria-label="Log in"
        >
          Login
        </Button>
      </slot>
    {/if}
  {/await}
</Base>

<style>
  .loading-btn,
  .avatar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    outline: none;
    padding: 0;
  }
  .avatar-btn:focus {
    outline: 2px solid #0056b3;
    outline-offset: 4px;
  }
  /* Circular loading button and avatar */
  .loading-btn,
  .avatar-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
  .loading-btn {
    background-color: #00bfff;
    animation: pulse 1s infinite ease-in-out;
  }
  .avatar-btn img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
</style>
