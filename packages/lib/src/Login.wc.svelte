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
  .login-btn,
  .loading-btn,
  .avatar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    outline: none;
  }
  /* Rectangular login button */
  .login-btn {
    width: 120px;
    height: 40px;
    border-radius: 5px;
    background-color: #007bff;
    color: white;
    font-size: 16px;
    font-weight: bold;
  }
  .login-btn:hover {
    background-color: #0056b3;
  }
  .login-btn:focus,
  .avatar-btn:focus {
    outline: 2px solid #0056b3;
    outline-offset: 4px;
  }
  /* Circular loading button and avatar */
  .loading-btn,
  .avatar-btn {
    width: 50px;
    height: 50px;
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
