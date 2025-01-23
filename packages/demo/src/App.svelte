<script lang="ts">
  import '../../lib';
  import NavBar from './components/NavBar.svelte';
  import { init } from '@sesamy/sesamy-js';

  let template = $state('ARTICLE');

  init({
    clientId: 'test-fokus',
    environment: 'dev',
    api: {
      namespace: 'sesamy'
    }
  });
</script>

<svelte:head>
  <meta property="sesamy:price" content="1337" />
  <meta property="sesamy:currency" content="SEK" />
  <meta property="sesamy:publisher-content-id" content="some-id" />
</svelte:head>

<NavBar />

<main>
  <aside></aside>
  <section>
    <sesamy-article
      item-src="https://stage.fokus.se/aktuellt/lorem-ipsum-dolor-sit-amet-consectetur/"
      pass="sid:a1tdI9vbB6AEPhICVGQqD"
      price="19"
      currency="SEK"
      publisher-content-id="some-id"
    >
      <h1>Sesamy article with remote content</h1>
      <div class="article-body">
        <sesamy-content-container
          item-src="https://stage.fokus.se/aktuellt/lorem-ipsum-dolor-sit-amet-consectetur/"
          lock-mode="proxy"
          locked-content-selector="article"
        >
          <div slot="preview">
            <p>
              Apples trådlösa hörlurar AirPods har kommit i en hel rad olika varianter och utgåvor
              sedan de först lanserades i september 2016. Den tidlösa designen tilltalar många, men
              smakar det så kostar det. <br />Den som vill lägga vantarna på ett par nya AirPods i
              dag behöver vara beredd att punga upp åtminstone 1 800 kronor, och de nyare modellerna
              ligger på nästan dubbelt så mycket.
            </p>
            <sesamy-paywall
              {template}
              settings-url="https://api.sesamy.dev/paywall/paywalls/test-fokus/ONh_7gBRk8U_L060YMUr2"
              item-src="https://stage.fokus.se/aktuellt/lorem-ipsum-dolor-sit-amet-consectetur/"
              redirect-url="https://sesamy.com"
            ></sesamy-paywall>
          </div>
        </sesamy-content-container>
      </div>
    </sesamy-article>
  </section>
  <section>
    <sesamy-article
      item-src="https://stage.fokus.se/aktuellt/lorem-ipsum-dolor-sit-amet-consectetur/"
      pass="sid:a1tdI9vbB6AEPhICVGQqD"
      price="19"
      currency="SEK"
      publisher-content-id="some-id"
    >
      <h1>Sesamy article with content slot</h1>
      <div class="article-body">
        <sesamy-content-container
          item-src="https://stage.fokus.se/aktuellt/lorem-ipsum-dolor-sit-amet-consectetur/"
          lock-mode="embed"
        >
          <div slot="preview">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc sed elit sollicitudin
              nisl condimentum suscipit vitae sed lacus. Nullam venenatis vestibulum eros vitae
              rutrum. Donec vel purus tempus metus vehicula fringilla.
            </p>
            <select value={template} onchange={({ target: { value } }: any) => (template = value)}>
              <option value="ARTICLE">Article</option>
              <option value="BOXES">Boxes</option>
            </select>
            <!-- https://portal-3p5j01f6y.vercel.sesamy.dev/test-fokus/paywalls/ONh_7gBRk8U_L060YMUr2 -->
            <sesamy-paywall
              {template}
              settings-url="https://api.sesamy.dev/paywall/paywalls/test-fokus/ONh_7gBRk8U_L060YMUr2"
              item-src="https://stage.fokus.se/aktuellt/lorem-ipsum-dolor-sit-amet-consectetur/"
              redirect-url="https://sesamy.com"
            ></sesamy-paywall>
          </div>
          <div slot="content">
            <p>Locked content</p>
            <p>
              Aenean accumsan ultrices aliquam. Morbi euismod non eros vel pellentesque. Sed sed
              molestie neque, eget fermentum ligula. Sed varius, libero vitae rutrum fringilla,
              nulla sem ultrices turpis, sed porta ligula elit eu ipsum. Quisque eu egestas est.
              Pellentesque ut varius elit, non luctus massa. Ut blandit velit at condimentum
              interdum.
            </p>
            <script>
              console.log('content');
            </script>
          </div>
        </sesamy-content-container>
      </div>
    </sesamy-article>
  </section>
  <section>
    <sesamy-article
      item-src="https://stage.fokus.se/aktuellt/lorem-ipsum-dolor-sit-amet-consectetur/"
      pass="sid:a1tdI9vbB6AEPhICVGQqD"
      price="19"
      currency="SEK"
      publisher-content-id="some-id"
    >
      <h1>Sesamy article with encoded content</h1>
      <div class="article-body">
        <sesamy-content-container
          item-src="https://stage.fokus.se/aktuellt/lorem-ipsum-dolor-sit-amet-consectetur/"
          lock-mode="encode"
        >
          <div slot="preview">
            <p>
              Apples trådlösa hörlurar AirPods har kommit i en hel rad olika varianter och utgåvor
              sedan de först lanserades i september 2016. Den tidlösa designen tilltalar många, men
              smakar det så kostar det. <br />Den som vill lägga vantarna på ett par nya AirPods i
              dag behöver vara beredd att punga upp åtminstone 1 800 kronor, och de nyare modellerna
              ligger på nästan dubbelt så mycket.
            </p>
            <select value={template} onchange={({ target: { value } }: any) => (template = value)}>
              <option value="ARTICLE">Article</option>
              <option value="BOXES">Boxes</option>
            </select>
            <!-- https://portal-3p5j01f6y.vercel.sesamy.dev/test-fokus/paywalls/ONh_7gBRk8U_L060YMUr2 -->
            <sesamy-paywall
              {template}
              settings-url="https://api.sesamy.dev/paywall/paywalls/test-fokus/ONh_7gBRk8U_L060YMUr2"
              item-src="https://stage.fokus.se/aktuellt/lorem-ipsum-dolor-sit-amet-consectetur/"
              redirect-url="https://sesamy.com"
            ></sesamy-paywall>
          </div>
          <div slot="content">
            PGRpdiBjbGFzcz0iYnJlYWR0ZXh0X2NvbnRlbnQiPjxwPjxhIGNsYXNzPSdkb3R0ZWRsaW5rJyBocmVmPScvYXBwbGUvJz5BcHBsZXM8L2E+IHRyw6VkbMO2c2EgaMO2cmx1cmFyIEFpclBvZHMgaGFyIGtvbW1pdCBpIGVuIGhlbCByYWQgb2xpa2EgdmFyaWFudGVyIG9jaCB1dGfDpXZvciBzZWRhbiBkZSBmw7Zyc3QgbGFuc2VyYWRlcyBpIHNlcHRlbWJlciAyMDE2LsKgPC9wPg0KPHA+RGVuIHRpZGzDtnNhIGRlc2lnbmVuIHRpbGx0YWxhciBtw6VuZ2EsIG1lbiBzbWFrYXIgZGV0IHPDpSBrb3N0YXIgZGV0LiBEZW4gc29tIHZpbGwgbMOkZ2dhIHZhbnRhcm5hIHDDpSBldHQgcGFyIG55YSBBaXJQb2RzIGkgZGFnIGJlaMO2dmVyIHZhcmEgYmVyZWRkIGF0dCBwdW5nYSB1cHAgw6V0bWluc3RvbmUgMSA4MDAga3Jvbm9yLCBvY2ggZGUgbnlhcmUgbW9kZWxsZXJuYSBsaWdnZXIgcMOlIG7DpHN0YW4gZHViYmVsdCBzw6UgbXlja2V0LsKgPC9wPg0KPHA+SGFyIG1hbiBsYWd0IHPDpSBteWNrZXQgcGVuZ2FyIHDDpSBlbiBtb2JpbGFjY2Vzc29hciBrYW4gZGV0IGvDpG5uYXMgdmlrdGlndCBhdHQgbnl0dGphIGRlbiB0aWxsIGZ1bGxvLCBvY2ggaW50ZSBnw6VyIG1pc3RlIG9tIHNtYXJ0YSBmdW5rdGlvbmVyIHNvbSBrYW4gbWF4aW1lcmEgdXBwbGV2ZWxzZW4uwqA8L3A+DQo8cD5Iw6RyIGxpc3RhciA8c3Ryb25nPk55aGV0ZXIyNDwvc3Ryb25nPiBmZW0gc3R5Y2tlbiwgc29tIGR1IGFudGFnbGlnZW4gbWlzc2F0LjwvcD48aDI+MS4gS25lcCBmw7ZyIGF0dCBoaXR0YSBib3J0dGFwcGFkZSBBaXJQb2RzPC9oMj48cD5WaSBoYXIgbm9nIGFsbGEgcsOla2F0IGzDpGdnYSBpZnLDpW4gb3NzIGVuIGF2IHbDpXJhIEFpclBvZHMgcMOlIGVuIGTDpWxpZyBwbGF0cywgb2NoIHNlbiBoYWZ0IHN2w6VydCBhdHQgaGl0dGEgZGVuIG7DpHIgZGV0IMOkciBkYWdzIGF0dCBnw6UgaGVtaWZyw6VuLiBEZXQga2FuIGR1IHNsaXBwYSBvbSBkdSBsYWd0IHRpbGwgZGVtIHNvbSBlbmhldGVyIGkgZGluICJIaXR0YSItYXBwIHNlZGFuIGlubmFuLjwvcD4NCjxwPsOEciBlbiBow7ZybHVyIGJvcnRhIGfDpXIgZHUgaW4gaSBhcHBlbiwgdHJ5Y2tlciBww6UgZGVuIGF2IGRpbmEgaMO2cmx1cmFyIHNvbSDDpHIgcMOlIHZpZnQgb2NoIHRyeWNrZXIgcMOlICJQbGF5IHNvdW5kIi8iU3BlbGEgbGp1ZCIuIETDpSBrb21tZXIgaMO2cmx1cmVuIGfDtnJhIGlmcsOlbiBzaWcgZXR0IHBpcGFuZGUgbGp1ZCBzb20gc21pZGlndCBrYW4gbGVkYSBkaWcgdGlsbCBkZW4uPC9wPjxoMj4yLiBTa3LDpGRkYXJzeSBkaW5hIHRyeWNra29tbWFuZG9uwqA8L2gyPjxwPkF0dCBldHQgc25hYmJ0IHRyeWNrIHDDpSBlbiBhdiBkaW5hIEFpclBvZHMgcGF1c2FyIGzDpXRlbiBkdSBseXNzbmFyIHDDpSwgYXR0IHR2w6UgdHJ5Y2sgc2tpcHBhciB0aWxsIG7DpHN0YSBsw6V0IG9jaCB0cmUgdHJ5Y2sgZ8OlciB0aWxsYmFrYSB0aWxsIGzDpXRlbiBpbm5hbiDigJMgZGV0IGhhciBub2cgZGUgZmxlc3RhIGtvbGwgcMOlLiBNZW4gb20gZHUgaGFyIGVuIG55YXJlIG1vZGVsbCBhdiBBaXJQb2RzIGVsbGVyIEFpclBvZHMgUHJvIGthbiBkdSBza3LDpGRkYXJzeSB2YWQgZHUgdmlsbCBhdHQgdmFyamUga29ydGtvbW1hbmRvIGfDtnIuwqA8L3A+DQo8cD5TZSBvbSBkdSBrYW4gYW52w6RuZGEgZnVua3Rpb25lbiBnZW5vbSBhdHQgZ8OlIGluIHDDpSAiSW5zdMOkbGxuaW5nYXIiLCAiQmx1ZXRvb3RoIiBvY2ggc2VkYW4gdHJ5Y2thIHDDpSBkZXQgYmzDpWEgSTpldCBmw7ZyICJJbmZvcm1hdGlvbiIgdGlsbCBow7ZnZXIgb20gZGluYSBow7ZybHVyYXJzIGVuaGV0c25hbW4uPC9wPg0KPHA+VHJ5Y2sgcMOlICJIw7ZnZXIiIG9jaCAiVsOkbnN0ZXIiIGbDtnIgYXR0IMOkbmRyYSBrb3J0a29tbWFuZG8gcMOlIHJlc3Bla3RpdmUgaMO2cmx1ci48L3A+PGgyPjMuIEfDtnIgZGV0IGVua2xhcmUgYXR0IGbDpSB0aWxsYmFrYSBkaW5hIGJvcnR0YXBwYWRlIEFpclBvZHM8L2gyPjxwPklibGFuZCDDpHIgb2x5Y2thbiBmcmFtbWUuIE9tIGR1IHRhcHBhdCBkaW5hIEFpclBvZHMgcMOlIGVuIG9mZmVudGxpZyBwbGF0cywgaSBrb2xsZWt0aXZ0cmFmaWtlbiBlbGxlciBww6Ugam9iYmV0IGthbiBkZXQgdmFyYSBzdsOlcnQgZsO2ciBkZW4gc29tIGhpdHRhciBkZW0gYXR0IHZldGEgdmVtIGRlIHRpbGxow7ZyLjwvcD4NCjxwPkbDtnIgYXR0IGfDtnJhIGpvYmJldCBsw6R0dGFyZSBmw7ZyIHVwcGhpdHRhcmVuIOKAkyBkw7ZwIGVuaGV0ZW4gdGlsbCBuw6Vnb3QgbWVyIGluZm9ybWF0aXZ0IMOkbiAiS2FsbGVzIEFpclBvZHMiLiBWYXJmw7ZyIGludGUgIlVwcGhpdHRhZGU/IFJpbmcgS2FsbGUgS2FybHNzb24gcMOlIDA3WC1YWFggWFggWCI/wqA8L3A+PGgyPjQuIERldCBiZXR5ZGVyIGFsbGEgZsOkcmdlciBww6UgZGl0dCBBaXJQb2RzLXNrYWw8L2gyPjxwPkRlbiBsaWxsYSBsanVza25hcHBlbiBww6UgZGl0dCBBaXJQb2RzLXNrYWwga2FuIGx5c2EgaSBmbGVyYSBvbGlrYSBmw6RyZ2VyLCBzb20gYWxsYSBzw6RnZXIgb2xpa2Egc2FrZXIgb20gZGluIGVuaGV0LiBEZXQgaMOkciBiZXR5ZGVyIGRlIG9saWthIGbDpHJnZXJuYSwgZW5saWd0IDxhIGhyZWY9Imh0dHBzOi8vd3d3LmlnZWVrc2Jsb2cuY29tL2FpcnBvZHMtdGlwcy10cmlja3MvIiB0YXJnZXQ9Il9ibGFuayIgcmVsPSJub2ZvbGxvdyI+aUdlZWtzYmxvZzwvYT46PC9wPjx1bD48bGk+R3LDtm50IGxqdXMsIG7DpHIgZGluYSBBaXJQb2RzIGxpZ2dlciBpIHNpdHQgc2thbCBvY2ggbG9ja2V0IMOkciDDtnBwZXQgLSBiZXR5ZGVyIGF0dCBow7ZybHVyYXJuYSDDpHIgZnVsbGFkZGFkZS48L2xpPjxsaT5HcsO2bnQgbGp1cywgbsOkciBkaW5hIEFpclBvZHMgaW50ZSBsaWdnZXIgaSBzaXR0IHNrYWwgb2NoIGxvY2tldCDDpHIgw7ZwcGV0IC0gYmV0eWRlciBhdHQgc2thbGV0IMOkciBmdWxsYWRkYXQuPC9saT48bGk+T3JhbmdldCBsanVzLMKgbsOkciBkaW5hIEFpclBvZHMgbGlnZ2VyIGkgc2l0dCBza2FsIG9jaCBsb2NrZXQgw6RyIMO2cHBldCAtIGJldHlkZXIgYXR0IGjDtnJsdXJhcm5hIGludGUgw6RyIGZ1bGxhZGRhZGUuPC9saT48bGk+T3JhbmdldCBsanVzLCBuw6RyIGRpbmEgQWlyUG9kcyBpbnRlIGxpZ2dlciBpIHNpdHQgc2thbCBvY2ggbG9ja2V0IMOkciDDtnBwZXQgLSBiZXR5ZGVyIGF0dCBza2FsZXQgw6RyIGZ1bGxhZGRhdC48L2xpPjxsaT5WaXR0IGJsaW5rYW5kZSBsanVzIC0gYmV0eWRlciBhdHQgZW5oZXRlbiBow6VsbGVyIHDDpSBhdHQgcGFyYXMgaWhvcCBtZWQgZW4gYW5uYW4sIGV4ZW1wZWx2aXMgZW4gdGVsZWZvbi48L2xpPjxsaT5PcmFuZ2V0IGJsaW5rYW5kZSBsanVzIC0gYmV0eWRlciBhdHQgZHUgbcOlc3RlIHBhcmtvcHBsYSBkaW5hIEFpclBvZHMgcMOlIG55dHQuPC9saT48bGk+SW5nZXQgbGp1cyAtIGJldHlkZXIgYXR0IGRlIMOkciB1cmxhZGRhZGUuPC9saT48L3VsPjxoMj41LiBHw7ZyIGRpbmEgQWlyUG9kcyB0aWxsIGjDtmd0YWxhcmU8L2gyPjxwPkV4YWt0IG7DpHIgbWFuIGthbiB0w6Rua2FzIHZpbGphIG55dHRqYSBkZW4gaMOkciBmdW5rdGlvbmVuIMOkciBzdsOlcnQgYXR0IHTDpG5rYSBzaWcsIGbDtnIgc2FubmluZ2VuIMOkciBhdHQgZGVuIGluYnlnZ2RhIGjDtmd0YWxhcmVuIHDDpSBkaW4gbW9iaWx0ZWxlZm9uIMOkciBiZXR5ZGxpZ3QgYsOkdHRyZSDDpG4gZGVuIGR1IGthbiBmw7ZydmFuZGxhIGRpbmEgQWlyUG9kcyB0aWxsLiBNZW4gZXR0IGdvdHQgcGFydHl0cmljayBoYXIgdsOkbCBhbGRyaWcgc3V0dGl0IGZlbD88L3A+DQo8cD5Gw7ZsaiBpbnN0cnVrdGlvbmVybmEgaSB2aWRlb24gbmVkYW4gZsO2ciBhdHQgZsO2cnZhbmRsYSBkaW5hIGjDtnJsdXJhciB0aWxsIGVuIGjDtmd0YWxhcmUuIERldCBmdW5rYXIgZmFrdGlza3QsIG1lbiBpbnRlIHJpa3RpZ3Qgc8OlIGJyYSBzb20gdmlkZW9uIHV0bG92YXIuPC9wPg0KPHA+PGJsb2NrcXVvdGUgY2xhc3M9InRpa3Rvay1lbWJlZCIgY2l0ZT0iaHR0cHM6Ly93d3cudGlrdG9rLmNvbS9AbGFycmlhbnNzL3ZpZGVvLzcyMjcxMTE4NzY5MTQ2NzkwNDUiIGRhdGEtdmlkZW8taWQ9IjcyMjcxMTE4NzY5MTQ2NzkwNDUiIHN0eWxlPSJtYXgtd2lkdGg6IDYwNXB4O21pbi13aWR0aDogMzI1cHg7IiA+IDxzZWN0aW9uPjwvc2VjdGlvbj4gPC9ibG9ja3F1b3RlPiA8c2NyaXB0IGFzeW5jIHNyYz0iaHR0cHM6Ly93d3cudGlrdG9rLmNvbS9lbWJlZC5qcyI+PC9zY3JpcHQ+PC9wPjwvZGl2PjxkaXYgY2xhc3M9ImFydGljbGVfcmVsYXRlZF9vdXRlciI+DQogICAgPGRpdiBjbGFzcz0iYXJ0aWNsZV9yZWxhdGVkIGFydGljbGVfd2lkdGgiPg0KDQogICAgICAgIDxoZWFkZXI+UmVsYXRlcmF0PC9oZWFkZXI+DQogICAgICAgIDxkaXY+DQogICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPSIvbnloZXRlci9pbnJpa2VzLzExMjQzODMtc2EtZmFyLWR1LW1vYmlsZW4tYXR0LWxhZGRhLXNuYWJiYXJlLTMtaGFja3MtYXR0LWxhZ2dhLXBhLW1pbm5ldCIgY2xhc3M9ImFydGljbGVfcmVsYXRlZF9pdGVtIj4NCiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJhcnRpY2xlX3JlbGF0ZWRfdGl0bGUiPlPDpSBmw6VyIGR1IG1vYmlsZW4gYXR0IGxhZGRhIHNuYWJiYXJlIOKAkyAzIGhhY2tzIGF0dCBsw6RnZ2EgcMOlIG1pbm5ldDwvZGl2Pg0KICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9ImFydGljbGVfcmVsYXRlZF9leGNlcnB0Ij5HbMO2bXQgbGFkZGEgbW9iaWxlbiBvY2ggbcOlc3RlIGfDpSBoZW1pZnLDpW4gb20gMzAgbWludXRlcj8gSMOkciDDpHIga25lcGVuIHNvbSBmw6VyIGRpbiBtb2JpbCBhdHQgbGFkZGEgc25hYmJhcmUuIE9jaCBORUosIHZpIHByYXRhciBpbnRlIG9tIGF0dCBzw6R0dGEgbW9iaWxlbiBww6UgZmx5Z3BsYW5zbMOkZ2Ug4oCTIHV0YW4gbGl0ZSB2YXNzYXJlIGhhY2tzLjwvZGl2Pg0KICAgICAgICAgICAgPC9hPg0KICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj0iL3ByZW1pdW0vdGVrbmlrLzExMjMwMjQtaGVtbGlnYS1rb2Rlci10aWxsLWRpbi1pcGhvbmUiIGNsYXNzPSJhcnRpY2xlX3JlbGF0ZWRfaXRlbSI+DQogICAgICAgICAgICAgICAgPGRpdiBjbGFzcz0iYXJ0aWNsZV9yZWxhdGVkX3RpdGxlIj43IGhlbWxpZ2Ega25lcCB0aWxsIGRpbiBJcGhvbmUg4oCTIHNvbSBkdSBJTlRFIHZpbGwgbGV2YSB1dGFuIDwvZGl2Pg0KICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9ImFydGljbGVfcmVsYXRlZF9leGNlcnB0Ij5IYXIgZHUgZW4gSXBob25lPyBEw6UgZmlubnMgZGV0IGZsZXJhIHNtYXJ0YSBrbmVwIG9jaCBoZW1saWdhIGdlbnbDpGdhciBzb20gZHUgaW50ZSB2ZXQgb20g4oCTIG1lbiBzb20gc2t1bGxlIHVuZGVybMOkdHRhIGRpdHQgbGl2IHbDpHNlbnRsaWd0LiBOeWhldGVyMjQgaGFyIGxpc3RhdCA3IGZhdm9yaXRlciwgc29tIGR1IGludGUga2FuIGxldmEgdXRhbiBuw6RyIGR1IHbDpGwgbMOkcnQgZGlnIGRlbS4gPC9kaXY+DQogICAgICAgICAgICA8L2E+DQogICAgICAgICAgICAgICAgICAgIDwvZGl2Pg0KICAgIDwvZGl2Pg0KPC9kaXY+PGRpdiBjbGFzcz0iYXJ0aWNsZV9ieWxpbmVfcHViX2NvbnRhaW5lciI+PGRpdiBjbGFzcz0iYXJ0aWNsZV9ieWxpbmVfcHViIGFydGljbGVfd2lkdGgiPjxkaXYgY2xhc3M9ImFydGljbGVfYnlsaW5lIj48ZGl2IGNsYXNzPSJhdXRob3JfYm94IGNsZWFyZml4IHNtYWxsIiBpdGVtcHJvcD0iYXV0aG9yIiBpdGVtc2NvcGUgaXRlbXR5cGU9Imh0dHA6Ly9zY2hlbWEub3JnL1BlcnNvbiI+DQogICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz0iY2xlYXJmaXgiPg0KICAgICAgICAgICAgPGRpdiBjbGFzcz0iYXV0aG9yX2xlZnQgY2xlYXJmaXgiPg0KDQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9Ii9wcm9maWwvbWF0aGlsZGEubHVuZHF2aXN0Ij4NCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgY2xhc3M9IiIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBzcmM9Imh0dHBzOi8vY2RuMDN0b2JpYXNrYXJsc3Nvbi5ueWhldGVyMjQuc2UvZDdmZGU3MTAwMjRiMDA0YjAwL3Byb2ZpbGUvYXZhdGFycy8xMDcxNjRfMTYxMTY2NzIyMy5qcGciPg0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2E+DQogICAgICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICANCiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImF1dGhvcl9yaWdodCBzaW5nbGUiPg0KICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9ImF1dGhvcl90ZXh0Ij4NCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgDQogICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9Ii9wcm9maWwvbWF0aGlsZGEubHVuZHF2aXN0IiBpdGVtcHJvcD0ibmFtZSI+DQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoaWxkYSBMdW5kcXZpc3QgICAgICAgICAgICAgICAgICAgIDwvYT4NCg0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0iYXV0aG9yX3RpdGxlIj5SZXBvcnRlcjwvc3Bhbj4NCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgIDwvZGl2Pg0KICAgIDwvZGl2PjwvZGl2PjwvZGl2PjwvZGl2Pg==
          </div>
        </sesamy-content-container>
      </div>
    </sesamy-article>
  </section>
  <aside style="min-width: 319px;">
    <!-- <sesamy-paywall
      {template}
      settings-url="https://api.sesamy.dev/paywall/paywalls/test-fokus/ONh_7gBRk8U_L060YMUr2"
    ></sesamy-paywall> -->
  </aside>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
  }

  aside {
    flex: 1;
    padding: 24px;
  }

  section {
    margin: 0 auto;
    max-width: 800px;
    padding: 40px;
    background: rgb(243 244 246);
    box-shadow: 0px 0px 24px rgba(0, 0, 0, 0.25);
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
