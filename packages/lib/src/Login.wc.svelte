<svelte:options customElement="sesamy-login" />

<script lang="ts">
  import Base from "./Base.svelte";
  import type { Api } from "./api";

  let loading = false;
  let loggedIn = false;
  let userAvatar = "https://via.placeholder.com/50"; // Placeholder avatar image

  // Function to handle login
  const login = async (api: Api) => {
    loading = true;
    try {
      // console.log("Logging in...");
      await api.auth.loginWithRedirect();
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      loading = false;
    }
  };

  // Function to handle logout
  const logout = async (api: Api) => {
    try {
      await api.auth.logout();
      loggedIn = false;
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Function to check if user is logged in
  const checkLoggedIn = async (api: Api) => {
    try {
      loggedIn = await api.auth.isAuthenticated();
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
      <!-- Logged In State -->
      <button
        class="avatar-btn"
        on:click={() => logout(api)}
        aria-label="Log out"
      >
        <img src={userAvatar} alt="User Avatar" />
      </button>
    {:else}
      <!-- Logged Out State -->
      <button class="login-btn" on:click={() => login(api)} aria-label="Log in">
        Login
      </button>
    {/if}
  {/await}
</Base>

<style>
  /* ... (styles remain the same) ... */
</style>
