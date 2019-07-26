const miio = require('miio')
let Service, Characteristic

module.exports = function (homebridge) {
    Service = homebridge.hap.Service
    Characteristic = homebridge.hap.Characteristic

    homebridge.registerAccessory("homebridge-mi-led-desk-lamp", "mi-led-desk-lamp", MiLedDesklamp)
}

class MiLedDesklamp {

    constructor(log, config) {
        // Setup configuration
        this.log = log
        this.name = config['name'] || 'Mi desk lamp'
        if (!config['ip']) {
            this.log('No IP address define for', this.name)
            return
        }
        if (!config['token']) {
            this.log('No token define for', this.name)
            return
        }
        this.ip = config['ip']
        this.token = config['token']

        // Setup services
        this.switch = new Service.Switch(this.name)
        this.switch.getCharacteristic(Characteristic.On)
            .on('get', this.getState.bind(this))
            .on('set', this.setState.bind(this))

        this.listenLampState().catch(error => this.log.error(error))
    }

    async getLamp() {
        if (this.lampDevice) return this.lampDevice
        this.log('Connect to device')
        try {
            this.lampDevice = await miio.device({address: this.ip, token: this.token})
        } catch (e) {
            this.lampDevice = undefined
            this.log.error('Device not connected', e)
        }
        return this.lampDevice
    }

    async listenLampState(){
        const device = await this.getLamp()
        device.on('powerChanged', isOn => this.switch.getCharacteristic(Characteristic.On).updateValue(isOn))
    }

    async getState(callback) {
        this.log('Get state...')
        try {
            const device = await this.getLamp()
            const power = await device.power()
            callback(null, power)
        } catch (e) {
            this.log.error('Error getting state', e)
            callback(e)
        }
    }

    async setState(state, callback) {
        this.log('Set state to', state)
        try {
            const device = await this.getLamp()
            await device.power(state)
            callback(null)
        } catch (e) {
            this.log.error('Error setting state', e)
            callback(e)
        }
    }

    getServices() {
        return [this.switch]
    }
}