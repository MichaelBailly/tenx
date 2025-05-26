// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  // Your custom configs here
  {
    rules: {
      "vue/html-self-closing": [
        "error",
        {
          html: {
            void: "always", // Allow self-closing void elements like <img/>
            normal: "never",
            component: "always",
          },
          svg: "always",
          math: "always",
        },
      ],
      "vue/first-attribute-linebreak": "off",
    },
  }
);
