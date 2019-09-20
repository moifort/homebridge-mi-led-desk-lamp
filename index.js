const miio = require('miio');
let Service, Characteristic;

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-mi-led-desk-lamp", "mi-led-desk-lamp", MiLedDesklamp);
};

class MiLedDesklamp {

    constructor(log, config) {
        // Setup configuration
        this.log = log;
        this.name = config['name'] || 'Mi desk lamp';
        if (!config['ip']) {
            this.log('No IP address define for', this.name);
            return;
        }
        if (!config['token']) {
            this.log('No token define for', this.name);
            return;
        }
        this.ip = config['ip'];
        this.token = config['token'];

        // Setup services
        this.lamp = new Service.Lightbulb(this.name);
        this.lamp.getCharacteristic(Characteristic.On)
            .on('get', this.getState.bind(this))
            .on('set', this.setState.bind(this));

        this.lamp.getCharacteristic(Characteristic.Brightness)
            .on('get', this.getBrightness.bind(this))
            .on('set', this.setBrightness.bind(this));

        this.lamp.getCharacteristic(Characteristic.ColorTemperature)
            .on('get', this.getColorTemperature.bind(this))
            .on('set', this.setColorTemperature.bind(this));

        this.listenLampState().catch(error => this.log.error(error));
    }

    async getLamp() {
        if (this.lampDevice) return this.lampDevice;
        this.log('Connect to device');
        try {
            this.lampDevice = await miio.device({address: this.ip, token: this.token});
        } catch (e) {
            this.lampDevice = undefined;
            this.log.error('Device not connected', e);
        }
        return this.lampDevice;
    }

    async listenLampState(){
        const device = await this.getLamp();
        device.on('powerChanged', isOn => this.lamp.getCharacteristic(Characteristic.On).updateValue(isOn));
	    device.on('colorChanged', color => this.lamp.getCharacteristic(Characteristic.ColorTemperature).updateValue(color));
    }

    async getState(callback) {
        this.log('Get state...');
        try {
            const device = await this.getLamp();
            const power = await device.power();
            callback(null, power);
        } catch (e) {
            this.log.error('Error getting state', e);
            callback(e);
        }
    }

    async setState(state, callback) {
        this.log('Set state to', state);
        try {
            const device = await this.getLamp();
            await device.power(state);
            callback(null);
        } catch (e) {
            this.log.error('Error setting state', e);
            callback(e);
        }
    }

    async getBrightness(callback) {
        this.log('Get brightness...');
        try {
            const device = await this.getLamp();
            const brightness = await device.brightness();
            callback(null, brightness);
        } catch (e) {
            this.log.error('Error getting brightness', e);
            callback(e);
        }
    }
	async setBrightness(state, callback) {
		this.log('Set brightness to', state);
		try {
			const device = await this.getLamp();
			await device.brightness('' + state);
			callback(null);
		} catch (e) {
			this.log.error('Error setting brightness', e);
			callback(e);
		}
    }
    
    async getColorTemperature(callback) {
        this.log('Get color...');
        try {
            const device = await this.getLamp();
            const color = await device.color();
            callback(null, color);
        } catch (e) {
            this.log.error('Error getting brightness', e);
            callback(e);
        }
    }
	async setColorTemperature(value, callback) {
        this.log('Set color to', value);
        value = Math.round(1000000 / value);
        if (value > 6500) {
            value = 6500;
        }
        if (value < 2700) {
            value = 2700;
        }
		try {
            const device = await this.getLamp();
            await device.call("set_ct_abx", [value, 'smooth', 1000]);
			callback(null);
		} catch (e) {
			this.log.error('Error setting color', e);
			callback(e);
		}
	}

    getServices() {
        return [this.lamp];
    }
}
