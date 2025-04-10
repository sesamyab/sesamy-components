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
    <li><sesamy-login></sesamy-login></li>
    <li>
      <sesamy-login>
        <div slot="popup-menu">
          <sesamy-login-menu-item type="LINK" href="https://sesamy.com" text="Sesamy"
          ></sesamy-login-menu-item>
          <div>test</div>
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
