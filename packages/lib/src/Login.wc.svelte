<svelte:options customElement="sesamy-login" />

<script lang="ts">
  let loading = false;
  let loggedIn = false;
  let userAvatar = "https://via.placeholder.com/50"; // Placeholder avatar image

  // Mock function to simulate login process
  const login = async () => {
    loading = true;
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate loading
    loading = false;
    loggedIn = true;
  };

  // Mock function to simulate logout process
  const logout = () => {
    loggedIn = false;
  };

  // Mock function to check if user is logged in (initially false)
  const checkLoggedIn = () => {
    return loggedIn;
  };

  // Simulate login status on component load
  loggedIn = checkLoggedIn();
</script>

{#if loading}
  <!-- Loading State -->
  <button class="loading-btn" aria-busy="true" aria-label="Logging in">
    <!-- Pulsating animation for loading state -->
  </button>
{:else if loggedIn}
  <!-- Logged In State -->
  <button class="avatar-btn" onclick={logout} aria-label="Log out">
    <img src={userAvatar} alt="User Avatar" />
  </button>
{:else}
  <!-- Logged Out State -->
  <button class="login-btn" onclick={login} aria-label="Log in"> Login </button>
{/if}

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
