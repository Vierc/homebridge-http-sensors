import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HttpSensorsPlatform } from './platform';

import http from 'bent';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class HttpSensorsPlatformAccessory {
  private service: Service;
  private getJSON = http('json');

  // Values
  private humidity = 100;
  private temperature = 100;

  constructor(
    private readonly platform: HttpSensorsPlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Xavier Roig')
      .setCharacteristic(this.platform.Characteristic.Model, 'Http Sensors')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'HttpS01');

      switch (accessory.context.device.type) {
        case 'humidity':
            // get the HumiditySensor service if it exists, otherwise create a new HumiditySensor service
            this.service = this.accessory.getService(this.platform.Service.HumiditySensor) || this.accessory.addService(this.platform.Service.HumiditySensor);
            // set the service name, this is what is displayed as the default name on the Home app
            this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
            // create handlers for required characteristics
            this.service.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
              .onGet(this.handleHumidityGet.bind(this));
          break;
        case 'temperature':
            // get the TemperatureSensor service if it exists, otherwise create a new TemperatureSensor service
            this.service = this.accessory.getService(this.platform.Service.TemperatureSensor) || this.accessory.addService(this.platform.Service.TemperatureSensor);
            // set the service name, this is what is displayed as the default name on the Home app
            this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
            // create handlers for required characteristics
            this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
              .onGet(this.handleTemperatureGet.bind(this));
          break;
        default:
          this.service = this.accessory.getService(this.platform.Service.HumiditySensor) || this.accessory.addService(this.platform.Service.HumiditySensor);
          return;
      }

    /**
     * Update the state of a Characteristic asynchronously instead of using the `on('get')` handlers.
     */
    setInterval(() => {

      this.getHttp(accessory.context.device.url)
      .then((res) => {

        this.platform.log.debug('get http json:', res);

        switch (accessory.context.device.type) {
          case 'humidity':
            if(res.humidity && !isNaN(Number(res.humidity)) && Number(res.humidity) >= 0 && Number(res.humidity) <= 100) {
              this.humidity = Number(res.humidity);
              this.service.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, this.humidity);
            }
            break;
          case 'temperature':
            if(res.temperature && !isNaN(Number(res.temperature)) && Number(res.temperature) >= 0 && Number(res.temperature) <= 100) {
              this.temperature = Number(res.temperature);
              this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.temperature);
            }
            break;
          default:
        }

      })
      .catch(e=>this.platform.log.error(e));

    }, 10000);
  }

  async getHttp(url:string) {
    try {
      let obj = await this.getJSON(url + '/json');
      return obj;
    } catch (e) {
      throw 'Server not found. URL: ' + url;
    }
  }

  /**
   * Handle requests to get the current value of the "Current Relative Humidity" characteristic
   */
  handleHumidityGet() {
    return this.humidity;
  }

  /**
   * Handle requests to get the current value of the "Current Temperature" characteristic
   */
  handleTemperatureGet() {
    return this.temperature;
  }


}
