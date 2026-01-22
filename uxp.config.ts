import { UXP_Manifest, UXP_Config } from "vite-uxp-plugin";
import { version } from "./package.json";

const extraPrefs = {
  hotReloadPort: 8080,
    copyZipAssets: ["public-zip/*"],
  uniqueIds: true,
};

export const id = "com.PremierePro-Smart-Export.uxp"; 
const name = "快速导出"; 

const manifest: UXP_Manifest = {
  id,
  name,
  version,
  main: "index.html",
  manifestVersion: 6,
  host: [
    {
      app: "premierepro",
      minVersion: "22.3",
    },
      ],
  entrypoints: [
    {
      type: "panel",
      id: `${id}.main`,
      label: {
        default: name,
      },
      minimumSize: { width: 430, height: 500 },
      maximumSize: { width: 2000, height: 2000 },
      preferredDockedSize: { width: 430, height: 600 },
      preferredFloatingSize: { width: 450, height: 650 },
      icons: [
        {
          width: 23,
          height: 23,
          path: "icons/dark.png",
          scale: [1, 2],
          theme: ["darkest", "dark", "medium"],
        },
        {
          width: 23,
          height: 23,
          path: "icons/light.png",
          scale: [1, 2],
          theme: ["lightest", "light"],
        },
      ],
    },


    // * Example of a UXP Secondary panel
    // * Must also enable the <uxp-panel panelid="bolt.uxp.plugin.settings">
    //* tag in your entrypoint (.tsx, .vue, or .svelte) file
    // {
    //   type: "panel",
    //   id: `${id}.settings`,
    //   label: {
    //     default: `${name} Settings`,
    //   },
    //   minimumSize: { width: 230, height: 200 },
    //   maximumSize: { width: 2000, height: 2000 },
    //   preferredDockedSize: { width: 230, height: 300 },
    //   preferredFloatingSize: { width: 230, height: 300 },
    //   icons: [
    //     {
    //       width: 23,
    //       height: 23,
    //       path: "icons/dark-panel.png",
    //       scale: [1, 2],
    //       theme: ["darkest", "dark", "medium"],
    //       species: ["chrome"],
    //     },
    //     {
    //       width: 23,
    //       height: 23,
    //       path: "icons/light-panel.png",
    //       scale: [1, 2],
    //       theme: ["lightest", "light"],
    //       species: ["chrome"],
    //     },
    //   ],
    // },

    // * Example of a UXP Command
    // {
    //   type: "command",
    //   id: "showAbout",
    //   label: {
    //     default: "Bolt UXP Command",
    //   },
    // },

  ],
  featureFlags: {
    enableAlerts: true,
  },
  requiredPermissions: {
    localFileSystem: "fullAccess",
    launchProcess: {
      schemes: ["file"],
      extensions: [""],
    },
    network: {
      domains: [
        `ws://localhost:${extraPrefs.hotReloadPort}`, // Required for hot reload in dev mode
      ],
    },
    clipboard: "readAndWrite",
    allowCodeGenerationFromStrings: false,
  },
    icons: [
    {
      width: 48,
      height: 48,
      path: "icons/plugin-icon.png",
      scale: [1, 2],
      theme: ["darkest", "dark", "medium", "lightest", "light", "all"],
      species: ["pluginList"],
    },
  ],
};

export const config: UXP_Config = {
  manifest,
  ...extraPrefs,
};
