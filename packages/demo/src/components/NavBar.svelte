<nav>
  <ul class="row">
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
    <li sesamy-visibility="logged-in"><a href="#" sesamy-link="account">Profile</a></li>
    <sesamy-visibility>
      <li slot="logged-in"><a href="#" sesamy-link="logout">Logout</a></li>
      <li slot="not-logged-in"><a href="#" sesamy-link="login">Login</a></li>
    </sesamy-visibility>
    <li>
      <sesamy-login
        style="
          --sesamy-font-family: Georgia; /* Sets font family, default Helvetica */
          --sesamy-login-button-background-color: blue; /* Sets background color of the login button, default transparent */
          --sesamy-login-button-text-color: pink; /* Sets text color of the login button, default black */
          --sesamy-login-button-border-color: green; /* Sets border color of the login button, default black */
          --sesamy-login-button-border-width: 5px; /* Sets border width of the login button, default 1px */
          --sesamy-login-button-border-radius: 20px; /* Sets border radius of the login button, default */
          --sesamy-login-button-font-weight: 100; /* Sets font weight of the login button, default 700 */
          --sesamy-login-popup-width: 400px; /* Sets width of the login popup, default 18rem */
          --sesamy-login-popup-bgcolor: green; /* Sets background color of the login popup, default white */
          --sesamy-login-popup-textcolor: pink; /* Sets text color of the login popup, default black */
          --sesamy-login-popup-border-color: red; /* Sets border color of the login popup, default #e5e7eb */
          --sesamy-login-popup-border-width: 5px; /* Sets border width of the login popup, default 1px */
          --sesamy-login-popup-border-radius: 20px; /* Sets border radius of the login popup, default 0.125rem */
          --sesamy-login-popup-zindex: 100; /* Sets z-index of the login popup, default 10 */
        "
      ></sesamy-login>
    </li>
    <li>
      <sesamy-login>
        <div slot="popup-menu">
          <sesamy-login-menu-item type="EMAIL"></sesamy-login-menu-item>
          <sesamy-login-menu-item type="ACCOUNT"></sesamy-login-menu-item>
          <sesamy-login-menu-item
            type="LINK"
            href="https://sesamy.com"
            target="_blank"
            text="Sesamy"
          ></sesamy-login-menu-item>
          <sesamy-login-menu-item type="LOGOUT"></sesamy-login-menu-item>
          <div style="padding:1rem;font-size:0.875rem;">Other custom menu content</div>
        </div>
      </sesamy-login>
    </li>
  </ul>
</nav>

<style>
  nav {
    padding: 1em;
    text-align: center;
    background: lightgray;
    position: relative;
  }

  ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
    display: flex;
    justify-content: center;
  }

  li {
    margin: 0 15px;
  }

  a {
    color: black;
    text-decoration: none;
    font-size: 1.2em;
  }

  a:hover {
    text-decoration: underline;
  }
</style>
