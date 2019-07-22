const miflora = require('miflora')
var Service, Characteristic


module.exports = function (homebridge) {
    Service = homebridge.hap.Service
    Characteristic = homebridge.hap.Characteristic

    homebridge.registerAccessory("homebridge-xiaomi-plant-monitor", "xiaomi-plant-monitor", MifloraAccessory)
}

class MifloraAccessory {

    constructor(log, config) {
        // Setup configuration
        this.log = log
        this.name = config['name'] || 'Mi Plant'
        if (!config['macAddress']) {
            this.log('No mac address define for', this.name)
            return
        }
        this.macAddress = config['macAddress'].toLocaleLowerCase()
        this.scanDurationInMs = config['scanDurationInMs'] || 60000
        this.fetchDataIntervalInMs = config['fetchDataIntervalInMs'] || 3600000

        // Data
        this.currentFirmwareVersion = '0.0.0'
        this.currentBattery = 0
        this.isLowBattery = this.currentBattery < 10
        this.currentTemperature = 0
        this.currentMoisture = 0
        this.currentLux = 0
        this.currentFertility = 0
        this.isActive = false

        // Setup services
        this.informationService = new Service.AccessoryInformation()
        this.informationService
            .setCharacteristic(Characteristic.Manufacturer, 'Xiaomi')
            .setCharacteristic(Characteristic.Model, 'Plant Monitor')
            .setCharacteristic(Characteristic.SerialNumber, this.macAddress)
        this.informationService.getCharacteristic(Characteristic.FirmwareRevision)
            .on('get', callback => callback(null, this.currentFirmwareVersion))

        this.batteryService = new Service.BatteryService(this.name)
        this.batteryService.setCharacteristic(Characteristic.ChargingState, Characteristic.ChargingState.NOT_CHARGEABLE)
        this.batteryService.getCharacteristic(Characteristic.BatteryLevel)
            .on('get', callback => callback(null, this.currentBattery))
        this.batteryService.getCharacteristic(Characteristic.StatusLowBattery)
            .on('get', callback => callback(null, this.getLowBatteryCharacteristic()))

        this.humidityService = new Service.HumiditySensor(this.name)
        this.humidityService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
            .on('get', callback => callback(null, this.currentMoisture))
        this.humidityService.getCharacteristic(Characteristic.StatusLowBattery)
            .on('get', callback => callback(null, this.getLowBatteryCharacteristic()))
        this.humidityService.getCharacteristic(Characteristic.StatusActive)
            .on('get', callback => callback(null, this.isActive))

        // Fetch sensor data
        this.fetchDataSensor().catch(error => this.log(error))
    }

    async fetchDataSensor() {
        this.log('Scanning %s for a max of %s seconds', this.macAddress, this.scanDurationInMs / 1000)
        this.log('Fetch data every %s seconds', this.fetchDataIntervalInMs / 1000)
        const devices = await miflora.discover({
            addresses: [this.macAddress],
            ignoreUnknown: true,
            duration: this.scanDurationInMs
        })
        const device = devices.find(entry => entry.address === this.macAddress)
        if (device) {
            await this.getPlantData(device)
            setInterval(() => this.getPlantData(device), this.fetchDataIntervalInMs)
        } else {
            this.log('Device %s not found', this.macAddress)
        }
    }

    async getPlantData(device) {
        try {
            const {firmwareInfo: {battery, firmware}, sensorValues: {temperature, lux, moisture, fertility}} = await device.query()
            this.currentFirmwareVersion = firmware
            this.currentBattery = battery
            this.currentTemperature = temperature
            this.currentLux = lux
            this.currentMoisture = moisture
            this.currentFertility = fertility
            this.isActive = true
            this.log(`battery: ${this.currentBattery}%  firmware: ${this.currentFirmwareVersion} temperature: ${this.currentTemperature}° lux: ${this.currentLux} moisture: ${this.currentMoisture}% fertility: ${this.currentFertility}`)

            this.informationService.getCharacteristic(Characteristic.FirmwareRevision).updateValue(this.currentFirmwareVersion)

            this.humidityService.getCharacteristic(Characteristic.CurrentRelativeHumidity).updateValue(this.currentMoisture)
            this.humidityService.getCharacteristic(Characteristic.StatusLowBattery).updateValue(this.getLowBatteryCharacteristic())
            this.humidityService.getCharacteristic(Characteristic.StatusActive).updateValue(this.isActive)

            this.batteryService.getCharacteristic(Characteristic.BatteryLevel).updateValue(this.currentBattery)
            this.batteryService.getCharacteristic(Characteristic.StatusLowBattery).updateValue(this.getLowBatteryCharacteristic())
        } catch (e) {
            this.log(e)
        }
    }

    getLowBatteryCharacteristic() {
        return this.isLowBattery ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL
    }

    getServices() {
        return [this.informationService, this.batteryService, this.humidityService]
    }
}