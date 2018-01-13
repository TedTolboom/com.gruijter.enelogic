'use strict';

const Homey = require('homey');

class LS120Device extends Homey.Device {

	// this method is called when the Device is inited
	async onInit() {
		// this.log('device init: ', this.getName(), 'id:', this.getData().id);
		try {
			// init some stuff
			this._driver = this.getDriver();
			this._ledring = Homey.app.ledring;
			this.isValidReading = this._driver.isValidReading.bind(this);
			this.handleNewReadings = this._driver.handleNewReadings.bind(this);
			this.watchDogCounter = 10;
			const settings = this.getSettings();
			// migrate from sdk1 version app
			if (!settings.hasOwnProperty('password')) {
				this.log('Whoohoo, migrating from v1 now :)');
				settings.password = '';
				settings.filterReadings = false;
				settings.model = '';
				settings.mac = '';
				settings.hasP1Meter = 'undefined';
				settings.hasGasMeter = 'undefined';
				settings.hasS0Meter = 'undefined';
				this.setSettings(settings)
					.catch(this.error);
			}
			this.meters = {};
			this.initMeters();
			// create youless session
			this.youless = new this._driver.Youless(settings.password, settings.youLessIp);
			// sync time in youless
			await this.youless.syncTime();
			// this.log(this.youless);
			// register trigger flow cards of custom capabilities
			this.tariffChangedTrigger = new Homey.FlowCardTriggerDevice('tariff_changed')
				.register();
			this.powerChangedTrigger = new Homey.FlowCardTriggerDevice('power_changed_LS120')
				.register();
			// register condition flow cards
			const offPeakCondition = new Homey.FlowCardCondition('offPeakLS120');
			offPeakCondition.register()
				.registerRunListener((args, state) => {
					// this.log('offPeak condition flow card requested');
					return Promise.resolve(this.meters.lastOffpeak);
				});
			// register action flow cards
			const reboot = new Homey.FlowCardAction('reboot_LS120');
			reboot.register()
				.on('run', (args, state, callback) => {
					this.log('reboot of device requested by action flow card');
					this.youless.reboot()
						.then(() => {
							this.log('rebooting now');
							this.setUnavailable('rebooting now')
								.catch(this.error);
							callback(null, true);
						})
						.catch((error) => {
							this.log(`rebooting failed ${error}`);
							callback(error);
						});
				});
			// start polling device for info
			this.intervalIdDevicePoll = setInterval(() => {
				try {
					if (this.watchDogCounter <= 0) {
						// restart the app here
						this.log('watchdog triggered, restarting app now');
						this.restartDevice();
					}
					// get new readings and update the devicestate
					this.doPoll();
				} catch (error) {
					this.watchDogCounter -= 1;
					this.log('intervalIdDevicePoll error', error);
				}
			}, 1000 * settings.pollingInterval);
		} catch (error) {
			this.log(error);
		}
	}

	// this method is called when the Device is added
	onAdded() {
		this.log(`LS120P1 added as device: ${this.getName()}`);
	}

	// this method is called when the Device is deleted
	onDeleted() {
		// stop polling
		clearInterval(this.intervalIdDevicePoll);
		this.log(`LS120P1 deleted as device: ${this.getName()}`);
	}

	onRenamed(name) {
		this.log(`LS120P1 renamed to: ${name}`);
	}

	// this method is called when the user has changed the device's settings in Homey.
	onSettings(oldSettingsObj, newSettingsObj, changedKeysArr, callback) {
		this.log('settings change requested by user');
		this.log(newSettingsObj);
		this.youless.login(newSettingsObj.password, newSettingsObj.youLessIp) // password, [host], [port]
			.then(() => {		// new settings are correct
				this.log(`${this.getName()} device settings changed`);
				// do callback to confirm settings change
				callback(null, true);
				this.restartDevice();
			})
			.catch((error) => {		// new settings are incorrect
				this.log(error.message);
				return callback(error, null);
			});
	}

	async doPoll() {
		// this.log('polling for new readings');
		let err;
		if (!this.youless.loggedIn) {
			await this.youless.login()
				.catch((error) => {
					this.log(`login during doPoll error: ${error}`);
					err = new Error(`doPoll login error: ${error}`);
				});
		}
		if (err) {
			this.setUnavailable(err)
				.catch(this.error);
			return;
		}
		await this.youless.getAdvancedStatus()
			.then((readings) => {
				this.setAvailable();
				// this.log(readings);
				if (this.getSettings().filterReadings && !this.isValidReading(readings)) {
					this.watchDogCounter -= 1;
					return;
				}
				this.handleNewReadings(readings);
			})
			.catch((error) => {
				this.watchDogCounter -= 1;
				this.log(`advanced status doPoll error: ${error}`);
				this.setUnavailable(error)
					.catch(this.error);
			});
	}

	restartDevice() {
		// stop polling the device, then start init after short delay
		clearInterval(this.intervalIdDevicePoll);
		setTimeout(() => {
			this.onInit();
		}, 10000);
	}

	initMeters() {
		this.meters = {
			lastMeasureGas: 0,										// 'measureGas' (m3)
			lastMeterGas: null, 									// 'meterGas' (m3)
			lastMeterGasTm: 0,										// timestamp of gas meter reading, e.g. 1514394325
			lastMeasurePower: 0,									// 'measurePower' (W)
			lastMeasurePowerAvg: 0,								// '2 minute average measurePower' (kWh)
			lastMeterPower: null,									// 'meterPower' (kWh)
			lastMeterPowerPeak: null,							// 'meterPower_peak' (kWh)
			lastMeterPowerOffpeak: null,					// 'meterPower_offpeak' (kWh)
			lastMeterPowerPeakProduced: null,			// 'meterPower_peak_produced' (kWh)
			lastMeterPowerOffpeakProduced: null,	// 'meterPower_offpeak_produced' (kWh)
			lastMeterPowerTm: null, 							// timestamp epoch, e.g. 1514394325
			lastMeterPowerInterval: null,					// 'meterPower' at last interval (kWh)
			lastMeterPowerIntervalTm: null, 			// timestamp epoch, e.g. 1514394325
			lastOffpeak: null,										// 'meterPower_offpeak' (true/false)
		};
	}

	updateDeviceState() {
		// this.log(`updating states for: ${this.getName()}`);
		try {
			this.setCapabilityValue('measure_power', this.meters.lastMeasurePower);
			this.setCapabilityValue('meter_offPeak', this.meters.lastOffpeak);
			this.setCapabilityValue('measure_gas', this.meters.lastMeasureGas);
			this.setCapabilityValue('meter_gas', this.meters.lastMeterGas);
			this.setCapabilityValue('meter_power', this.meters.lastMeterPower);
			this.setCapabilityValue('meter_power.peak', this.meters.lastMeterPowerPeak);
			this.setCapabilityValue('meter_power.offPeak', this.meters.lastMeterPowerOffpeak);
			this.setCapabilityValue('meter_power.producedPeak', this.meters.lastMeterPowerPeakProduced);
			this.setCapabilityValue('meter_power.producedOffPeak', this.meters.lastMeterPowerOffpeakProduced);
			// update the device info
			const deviceInfo = this.youless.info;
			const settings = this.getSettings();
			Object.keys(deviceInfo).forEach((key) => {
				if (settings[key] !== deviceInfo[key].toString()) {
					this.log(`device information has changed. ${key}: ${deviceInfo[key].toString()}`);
					this.setSettings({ [key]: deviceInfo[key].toString() })
						.catch(this.error);
				}
			});
			// reset watchdog
			this.watchDogCounter = 10;
		} catch (error) {
			this.log(error);
		}
	}

}

module.exports = LS120Device;