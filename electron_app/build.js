// filepath: build.js
module.exports = {
  "extraMetadata": {
    "version": "4.3.0"
  },
  "publish": [
    {
      "provider": "github",
      "owner": "Imhotep-Tech",
      "repo": "imhotep_finance",
      "releaseType": "release"
    }
  ],
  "linux": {
    "target": [
      "AppImage",
      "deb"
    ],
    "icon": "icon.png",
    "category": "Utility",
    "maintainer": "Karim Bassem <imhoteptech@outlook.com>"
  }
};