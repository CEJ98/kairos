const { withAppDelegate } = require('@expo/config-plugins');

module.exports = {
	type: 'widget',
	name: 'KairosWidget',
	bundleIdentifier: 'com.kairos.widget',
	deploymentTarget: '14.0',
	entitlements: {
		'com.apple.security.application-groups': ['group.com.kairos.shared']
	},
	infoPlist: {
		NSExtension: {
			NSExtensionPointIdentifier: 'com.apple.widgetkit-extension',
			NSExtensionPrincipalClass: 'KairosWidgetBundle'
		}
	}
};