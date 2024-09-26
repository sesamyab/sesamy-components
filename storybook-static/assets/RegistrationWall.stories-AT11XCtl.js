import{k as a}from"./lit-html-DZH-Jm0H.js";import"./sesamy-components.es-DcGkowaI.js";const y={title:"Components/RegistrationWall",tags:["autodocs"],component:"sesamy-registration-wall",render:t=>a`
      <sesamy-registration-wall>
        ${t.title?a`<h1 slot="title">${t.title}</h1>`:""}
        ${t.description?a`<p slot="description">${t.description}</p>`:""}
      </sesamy-registration-wall>
      <style>
        sesamy-registration-wall::part(continueButton) {
          background-color: ${t.buttonColor};
        }
      </style>
    `,argTypes:{title:{control:"text",defaultValue:"Default Title",description:"Title text for the registration wall"},buttonColor:{control:"color",defaultValue:"#007bff",description:"Sets the background color of the continue button"},maxWidth:{control:{type:"text"},description:"Sets the max-width of the component",table:{category:"CSS Variables",defaultValue:{summary:"500px"}}},fontFamily:{control:{type:"text"},description:"Sets the font family of the component",table:{category:"CSS Variables",defaultValue:{summary:"Arial, sans-serif"}}}}},o={args:{buttonColor:"#007bff",maxWidth:"500px",fontFamily:"Arial, sans-serif"},decorators:[(t,{args:e})=>a`
      <style>
        sesamy-registration-wall {
          --max-width: ${e.maxWidth};
          --font-family: ${e.fontFamily};
        }
      </style>
      ${t()}
    `]},s={args:{title:"Another Custom Title",description:"This is a custom description for the registration wall",maxWidth:"600px",fontFamily:"'Helvetica Neue', Helvetica, Arial, sans-serif"},decorators:[(t,{args:e})=>a`
      <style>
        sesamy-registration-wall {
          --max-width: ${e.maxWidth};
          --font-family: ${e.fontFamily};
        }
      </style>
      ${t()}
    `]};var r,i,n;o.parameters={...o.parameters,docs:{...(r=o.parameters)==null?void 0:r.docs,source:{originalSource:`{
  args: {
    buttonColor: "#007bff",
    maxWidth: "500px",
    fontFamily: "Arial, sans-serif"
  },
  decorators: [(story, {
    args
  }) => html\`
      <style>
        sesamy-registration-wall {
          --max-width: \${args.maxWidth};
          --font-family: \${args.fontFamily};
        }
      </style>
      \${story()}
    \`]
}`,...(n=(i=o.parameters)==null?void 0:i.docs)==null?void 0:n.source}}};var l,m,c;s.parameters={...s.parameters,docs:{...(l=s.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    title: "Another Custom Title",
    description: "This is a custom description for the registration wall",
    maxWidth: "600px",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
  },
  decorators: [(story, {
    args
  }) => html\`
      <style>
        sesamy-registration-wall {
          --max-width: \${args.maxWidth};
          --font-family: \${args.fontFamily};
        }
      </style>
      \${story()}
    \`]
}`,...(c=(m=s.parameters)==null?void 0:m.docs)==null?void 0:c.source}}};const p=["Default","Slots"];export{o as Default,s as Slots,p as __namedExportsOrder,y as default};
