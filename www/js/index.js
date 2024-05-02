var app = {
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    onDeviceReady: function() {
        console.log('device ready');
        this.getDeviceUUID();
    },

    getDeviceUUID: function() {
        const platformId = window.cordova.platformId;
        const deviceInfo = document.getElementById('device-info');
        let uuid = null;
        if (device && device.uuid && ['ios', 'android', 'electron'].indexOf(platformId) >= 0) {
            // get uuid from cordova-plugin-device
            uuid = device.uuid;
        } else {
            // other platforms such as browser, ...
            uuid = `The ${platformId} platform is not supported.`;
        }
        if (uuid) deviceInfo.innerHTML = `Device UUID: ${uuid}`;
    }
};

app.initialize();
