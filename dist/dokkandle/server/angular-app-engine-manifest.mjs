
export default {
  basePath: 'https://LennyB972.github.io/dokkandle',
  supportedLocales: {
  "en-US": ""
},
  entryPoints: {
    '': () => import('./main.server.mjs')
  },
};
