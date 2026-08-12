// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ativa "package exports" para que os deep imports por-ícone
// (@hugeicons/core-free-icons/Home07Icon) resolvam e o bundle faça
// tree-shaking em vez de arrastar as ~4000 ícones do barrel.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
