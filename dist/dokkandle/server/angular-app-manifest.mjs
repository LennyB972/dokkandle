
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: 'https://LennyB972.github.io/dokkandle/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/dokkandle"
  },
  {
    "renderMode": 2,
    "route": "/dokkandle/guess-character"
  },
  {
    "renderMode": 2,
    "route": "/dokkandle/leader-skill"
  },
  {
    "renderMode": 2,
    "route": "/dokkandle/passive"
  },
  {
    "renderMode": 2,
    "route": "/dokkandle/silhouette"
  },
  {
    "renderMode": 2,
    "route": "/dokkandle/daily"
  },
  {
    "renderMode": 2,
    "redirectTo": "/dokkandle",
    "route": "/dokkandle/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 720, hash: '70d4d0a0607ef369f6fd0a834c2d4a48efa6e90346ed730243dd892ed16a793b', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1043, hash: 'd47b566f895d927d0cfc65870651d3384ea7db1ed42e982e2267bb1b1c246af1', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'guess-character/index.html': {size: 4359, hash: '0c471ab57b8ab43196e09f700bbc7f18ae6080db4e61a7f2466b34be593f7743', text: () => import('./assets-chunks/guess-character_index_html.mjs').then(m => m.default)},
    'passive/index.html': {size: 4359, hash: '0c471ab57b8ab43196e09f700bbc7f18ae6080db4e61a7f2466b34be593f7743', text: () => import('./assets-chunks/passive_index_html.mjs').then(m => m.default)},
    'silhouette/index.html': {size: 4359, hash: '0c471ab57b8ab43196e09f700bbc7f18ae6080db4e61a7f2466b34be593f7743', text: () => import('./assets-chunks/silhouette_index_html.mjs').then(m => m.default)},
    'daily/index.html': {size: 4359, hash: '0c471ab57b8ab43196e09f700bbc7f18ae6080db4e61a7f2466b34be593f7743', text: () => import('./assets-chunks/daily_index_html.mjs').then(m => m.default)},
    'index.html': {size: 4359, hash: '0c471ab57b8ab43196e09f700bbc7f18ae6080db4e61a7f2466b34be593f7743', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'leader-skill/index.html': {size: 4359, hash: '0c471ab57b8ab43196e09f700bbc7f18ae6080db4e61a7f2466b34be593f7743', text: () => import('./assets-chunks/leader-skill_index_html.mjs').then(m => m.default)},
    'styles-THOAH3BQ.css': {size: 65, hash: 'cvajVqW2Ef0', text: () => import('./assets-chunks/styles-THOAH3BQ_css.mjs').then(m => m.default)}
  },
};
