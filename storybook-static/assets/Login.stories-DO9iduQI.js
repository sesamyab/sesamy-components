import{k as g}from"./lit-html-DZH-Jm0H.js";import"./sesamy-components.es-DcGkowaI.js";const p={title:"Components/Login",tags:["autodocs"],component:"sesamy-login",render:e=>g`
    <sesamy-login
      .buttonText=${e.buttonText}
      @login=${e.onLogin}
    ></sesamy-login>
  `,argTypes:{buttonText:{control:"text"},onLogin:{action:"login"}}},o={args:{buttonText:"Log In"}},t={args:{buttonText:"Sign In Now"}};var n,s,r;o.parameters={...o.parameters,docs:{...(n=o.parameters)==null?void 0:n.docs,source:{originalSource:`{
  args: {
    buttonText: "Log In"
  }
}`,...(r=(s=o.parameters)==null?void 0:s.docs)==null?void 0:r.source}}};var a,c,m;t.parameters={...t.parameters,docs:{...(a=t.parameters)==null?void 0:a.docs,source:{originalSource:`{
  args: {
    buttonText: "Sign In Now"
  }
}`,...(m=(c=t.parameters)==null?void 0:c.docs)==null?void 0:m.source}}};const l=["Default","CustomText"];export{t as CustomText,o as Default,l as __namedExportsOrder,p as default};
