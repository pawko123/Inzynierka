const { withAndroidManifest } = require('@expo/config-plugins');

function withReactNativeWebRTC(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    
    // Add WebRTC permissions
    const permissions = [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_ADMIN',
      'android.permission.WAKE_LOCK'
    ];

    permissions.forEach(permission => {
      if (!androidManifest.manifest['uses-permission']?.find(p => p.$['android:name'] === permission)) {
        if (!androidManifest.manifest['uses-permission']) {
          androidManifest.manifest['uses-permission'] = [];
        }
        androidManifest.manifest['uses-permission'].push({
          $: { 'android:name': permission }
        });
      }
    });

    // Add hardware features
    const features = [
      { name: 'android.hardware.camera', required: false },
      { name: 'android.hardware.camera.autofocus', required: false },
      { name: 'android.hardware.microphone', required: false },
      { name: 'android.hardware.bluetooth', required: false }
    ];

    features.forEach(feature => {
      if (!androidManifest.manifest['uses-feature']?.find(f => f.$['android:name'] === feature.name)) {
        if (!androidManifest.manifest['uses-feature']) {
          androidManifest.manifest['uses-feature'] = [];
        }
        androidManifest.manifest['uses-feature'].push({
          $: { 
            'android:name': feature.name,
            'android:required': feature.required.toString()
          }
        });
      }
    });

    return config;
  });
}

module.exports = withReactNativeWebRTC;