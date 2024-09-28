<script lang="ts">
  import "../../lib";
  import NavBar from "./components/NavBar.svelte";
</script>

<main>
  <NavBar />
  <section class="content bg-green-500">
    <article>
      <h1>Sesamy Components Demo Page</h1>

      <sesamy-avatar size="md" />

      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc sed elit
        sollicitudin nisl condimentum suscipit vitae sed lacus. Nullam venenatis
        vestibulum eros vitae rutrum. Donec vel purus tempus metus vehicula
        fringilla. Donec id tempus libero. Morbi feugiat ante vel dignissim
        mollis. Phasellus vehicula, metus at condimentum molestie, nibh lectus
        ullamcorper lectus, quis tempus neque risus nec felis. Sed quis quam et
        leo vulputate luctus. Sed aliquet lobortis tincidunt. Nam mollis ligula
        ac mattis sagittis. Phasellus condimentum, sapien sit amet maximus
        fermentum, lacus risus sodales mi, luctus tincidunt leo massa nec
        lectus. Phasellus mattis eu nunc ac eleifend. Proin lobortis tortor non
        mauris vulputate ullamcorper. Cras commodo risus quis augue varius
        posuere.
      </p>
      <p>
        Aenean accumsan ultrices aliquam. Morbi euismod non eros vel
        pellentesque. Sed sed molestie neque, eget fermentum ligula. Sed varius,
        libero vitae rutrum fringilla, nulla sem ultrices turpis, sed porta
        ligula elit eu ipsum. Quisque eu egestas est. Pellentesque ut varius
        elit, non luctus massa. Ut blandit velit at condimentum interdum.
      </p>
      <sesamy-paywall></sesamy-paywall>
    </article>
  </section>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: sans-serif;
  }

  .content {
    flex: 1;
    padding: 20px;
  }

  article {
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    font-size: 2em;
    margin-bottom: 0.5em;
  }

  p {
    font-size: 1.2em;
    line-height: 1.5;
  }
</style>
