import{D as p,k as g}from"./lit-html-DZH-Jm0H.js";import"./sesamy-components.es-DcGkowaI.js";/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const n=e=>e??p,D={title:"Components/Button",tags:["autodocs"],component:"sesamy-button",render:e=>g`
    <sesamy-button
      .disabled=${n(e.disabled)}
      .loading=${n(e.loading)}
      .outline=${n(e.outline)}
      @click=${e.onClick}
      >${e.buttonText}</sesamy-button
    >
  `,argTypes:{buttonText:{control:"text"},disabled:{control:"boolean",defaultValue:!1},loading:{control:"boolean",defaultValue:!1},outline:{control:"boolean",defaultValue:!0},onClick:{action:"clicked"}}},t={args:{buttonText:"Default",outline:!0,disabled:!1,loading:!1}},o={args:{buttonText:"Disabled Button",disabled:!0}},a={args:{buttonText:"Loading Button",loading:!0}};var s,r,l;t.parameters={...t.parameters,docs:{...(s=t.parameters)==null?void 0:s.docs,source:{originalSource:`{
  args: {
    buttonText: "Default",
    outline: true,
    disabled: false,
    loading: false
  }
}`,...(l=(r=t.parameters)==null?void 0:r.docs)==null?void 0:l.source}}};var u,d,i;o.parameters={...o.parameters,docs:{...(u=o.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    buttonText: "Disabled Button",
    disabled: true
  }
}`,...(i=(d=o.parameters)==null?void 0:d.docs)==null?void 0:i.source}}};var c,b,m;a.parameters={...a.parameters,docs:{...(c=a.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    buttonText: "Loading Button",
    loading: true
  }
}`,...(m=(b=a.parameters)==null?void 0:b.docs)==null?void 0:m.source}}};const T=["Default","Disabled","Loading"];export{t as Default,o as Disabled,a as Loading,T as __namedExportsOrder,D as default};
