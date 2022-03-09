"use strict";

/*
 * Created with @iobroker/create-adapter v2.1.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const { rejects } = require("assert");
const { request, get } = require("http");
const { resolve } = require("path");
const { resourceLimits } = require("worker_threads");

const axios = require("axios");
const { stringify } = require("querystring");

let Intervall_ID;

//Reference to my own adapter
let myAdapter;

let universalReturnValue = null;

// Load your modules here, e.g.:
// const fs = require("fs");

class Wasserwaechter extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "wasserwaechter",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		this.log.info("Device Language: " + this.config.device_language);
		this.log.info("Device Units: " + this.config.device_units);
		this.log.info("Max Flow Leakage Time: " + this.config.device_maxflowleakagetime);
		this.log.info("Micro Leakage Test: " + this.config.device_microleakagetest);
		this.log.info("Micro Leakage Test Period: " + this.config.device_microleakagetestperiod);
		this.log.info("Buzzer On Alarm: " + this.config.device_buzzeronalarm);

		this.log.info("Conductivity Limit: " + this.config.device_conductivitylimit);

		this.log.info("Device Network Address: " + this.config.device_network_ip);
		this.log.info("Device Network Port: " + this.config.device_network_port);
		this.log.info("Device Polling Intervall in seconds: " + this.config.device_poll_interval);

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/


		await this.setObjectNotExistsAsync("testVariable", {
			type: "state",
			common: {
				name: "testVariable",
				type: "boolean",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		// ===============================================================
		// Adapter Settings
		// ===============================================================
		await this.setObjectNotExistsAsync("Adapter.PollingInterval", {
			type: "state",
			common: {
				name: "Adapter Polling Interval",
				type: "string",
				role: "indicator",
				unit: "s",
				read: true,
				write: true,
			},
			native: {},
		});

		// ===============================================================
		// Device States
		// ===============================================================
		await this.setObjectNotExistsAsync("Device.SerialNumber", {
			type: "state",
			common: {
				name: "Device Serial Number",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Device.CodeNumber", {
			type: "state",
			common: {
				name: "Device Code Number",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Device.MacAddress", {
			type: "state",
			common: {
				name: "Device MAC Address",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Device.FirmwareVersion", {
			type: "state",
			common: {
				name: "Device Firmware Version",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Device.NextMaintenance", {
			type: "state",
			common: {
				name: "Device Next Maintenance",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Device.IP", {
			type: "state",
			common: {
				name: "Device IP Address",
				type: "string",
				role: "indicator",
				unit: "IPv4",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Device.Port", {
			type: "state",
			common: {
				name: "Device API Port",
				type: "string",
				role: "indicator",
				unit: "Port",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Device.Sensors.TemperatureSensorInstalled", {
			type: "state",
			common: {
				name: "Device Temperature Sensor is installed",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("Device.Sensors.PressureSensorInstalled", {
			type: "state",
			common: {
				name: "Device Pressure Sensor is installed",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Device.Sensors.ConductivitySensorInstalled", {
			type: "state",
			common: {
				name: "Device Conductivity Sensor is installed",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});


		// ===============================================================
		// User Settings
		// ===============================================================
		await this.setObjectNotExistsAsync("Settings.Language", {
			type: "state",
			common: {
				name: "Device Language",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Settings.Units", {
			type: "state",
			common: {
				name: "Device Units",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Settings.MaxFlowLeakageTime", {
			type: "state",
			common: {
				name: "Max Flow Leakage Time",
				type: "string",
				role: "indicator",
				unit: "min",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Settings.MicroLeakageTest", {
			type: "state",
			common: {
				name: "Micro Leakage Test",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Settings.MicroLeakageTestPeriod", {
			type: "state",
			common: {
				name: "Micro Leakage Test Period",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Settings.BuzzerOnAlarm", {
			type: "state",
			common: {
				name: "Buzzer On Alarm",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Settings.ConductivityLimit", {
			type: "state",
			common: {
				name: "Conductivity Limit",
				type: "string",
				role: "indicator",
				unit: "uS/cm",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Settings.ConductivityFactor", {
			type: "state",
			common: {
				name: "Conductivity Factor",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		// ===============================================================
		// Condition States
		// ===============================================================
		await this.setObjectNotExistsAsync("Conditions.WaterTemperature", {
			type: "state",
			common: {
				name: "Water Temperature",
				type: "string",
				role: "indicator",
				unit: "°",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Conditions.WaterPressure", {
			type: "state",
			common: {
				name: "Water Pressure",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Conditions.WaterConductivity", {
			type: "state",
			common: {
				name: "Water Conductivity",
				type: "string",
				role: "indicator",
				unit: "uS/cm",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Conditions.BatteryVoltage", {
			type: "state",
			common: {
				name: "Device Battery Voltage",
				type: "string",
				role: "indicator",
				unit: "V",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Conditions.PowerAdaptorDcVoltage", {
			type: "state",
			common: {
				name: "Power Adaptor DC Voltage",
				type: "string",
				role: "indicator",
				unit: "V",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Conditions.StopValve", {
			type: "state",
			common: {
				name: "Device Status Stop Valve",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Conditions.Alarm", {
			type: "state",
			common: {
				name: "Device Alarm Status",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		// Leakage protection temporary deactivation
		await this.setObjectNotExistsAsync("Conditions.LeakageProtectionTemporaryDeactivation", {
			type: "state",
			common: {
				name: "Device Leakage Protection Temporary Deactivation",
				type: "string",
				role: "indicator",
				unit: "s",
				read: true,
				write: true,
			},
			native: {},
		});


		// ===============================================================
		// Consumptions States
		// ===============================================================

		await this.setObjectNotExistsAsync("Consumptions.LastVolume", {
			type: "state",
			common: {
				name: "Last Volume",
				type: "string",
				role: "indicator",
				unit: "L",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Consumptions.TotalVolume", {
			type: "state",
			common: {
				name: "Total Volume",
				type: "string",
				role: "indicator",
				unit: "m3",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Consumptions.CurrentVolume", {
			type: "state",
			common: {
				name: "Current Volume",
				type: "string",
				role: "indicator",
				unit: "L",
				read: true,
				write: true,
			},
			native: {},
		});


		// Profile

		await this.setObjectNotExistsAsync("Profiles.SelectedProfile", {
			type: "state",
			common: {
				name: "Selected Profile",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("Profiles.Active", {
			type: "state",
			common: {
				name: "Active Profiles",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		// Die Objekte für die 8 Profile erstellen
		for (let i = 1; i < 9; i++){
			// Profil Aktiv
			await this.setObjectNotExistsAsync("Profiles." + String(i) + ".Aktiv", {
				type: "state",
				common: {
					name: "Profil Aktiv",
					type: "string",
					role: "indicator",
					read: true,
					write: true,
				},
				native: {},
			});

			// Profil Name
			await this.setObjectNotExistsAsync("Profiles." + String(i) + ".Name", {
				type: "state",
				common: {
					name: "Profil Name",
					type: "string",
					role: "indicator",
					read: true,
					write: true,
				},
				native: {},
			});

			// Profil Volume Leckage
			await this.setObjectNotExistsAsync("Profiles." + String(i) + ".LeakVolume", {
				type: "state",
				common: {
					name: "Profil Volume Leak",
					type: "string",
					role: "indicator",
					unit: "L",
					read: true,
					write: true,
				},
				native: {},
			});

			// Profil Zeit Leckage
			await this.setObjectNotExistsAsync("Profiles." + String(i) + ".LeakTime", {
				type: "state",
				common: {
					name: "Profil Time Leak",
					type: "string",
					role: "indicator",
					unit: "min",
					read: true,
					write: true,
				},
				native: {},
			});

			// Profil MaxFlow Leckage
			await this.setObjectNotExistsAsync("Profiles." + String(i) + ".LeakMaxFlow", {
				type: "state",
				common: {
					name: "Profil Max Flow L/h Leak",
					type: "string",
					role: "indicator",
					unit: "L/h",
					read: true,
					write: true,
				},
				native: {},
			});

			// Profil Micro Leak Detection
			await this.setObjectNotExistsAsync("Profiles." + String(i) + ".LeakMicroLeakDetection", {
				type: "state",
				common: {
					name: "Profil Microleak detection",
					type: "string",
					role: "indicator",
					read: true,
					write: true,
				},
				native: {},
			});

			// Profil Return Time to Standard Profil
			await this.setObjectNotExistsAsync("Profiles." + String(i) + ".ReturnTimeToStandardProfile", {
				type: "state",
				common: {
					name: "Returne Time to Standard Profile",
					type: "string",
					role: "indicator",
					unit: "h",
					read: true,
					write: true,
				},
				native: {},
			});

			// Profil Buzzer
			await this.setObjectNotExistsAsync("Profiles." + String(i) + ".Buzzer", {
				type: "state",
				common: {
					name: "Profil Buzzer",
					type: "string",
					role: "indicator",
					read: true,
					write: true,
				},
				native: {},
			});

			// Profil Leak Warning
			await this.setObjectNotExistsAsync("Profiles." + String(i) + ".LeakageWarning", {
				type: "state",
				common: {
					name: "Profil Leakage Warning",
					type: "string",
					role: "indicator",
					read: true,
					write: true,
				},
				native: {},
			});
		}


		// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
		this.subscribeStates("testVariable");

		this.subscribeStates("Adapter.PollingInterval");

		this.subscribeStates("Device.FirmwareVersion");
		this.subscribeStates("Device.IP");
		this.subscribeStates("Device.Port");
		this.subscribeStates("Device.SerialNumber");
		this.subscribeStates("Device.CodeNumber");
		this.subscribeStates("Device.MacAddress");
		this.subscribeStates("Device.NextMaintenance");

		this.subscribeStates("Settings.Language");
		this.subscribeStates("Device.Sensors.TemperatureSensorInstalled");
		this.subscribeStates("Device.Sensors.PressureSensorInstalled");
		this.subscribeStates("Device.Sensors.ConductivitySensorInstalled");
		this.subscribeStates("Settings.ConductivityLimit");
		this.subscribeStates("Settings.ConductivityFactor");

		this.subscribeStates("Conditions.Conditions.WaterTemperature");
		this.subscribeStates("Conditions.Conditions.WaterPressure");
		this.subscribeStates("Conditions.Conditions.WaterConductivity");
		this.subscribeStates("Conditions.BatteryVoltage");
		this.subscribeStates("Conditions.PowerAdaptorDcVoltage");
		this.subscribeStates("Conditions.StopValve");
		this.subscribeStates("Conditions.Alarm");
		this.subscribeStates("Conditions.LeakageProtectionTemporaryDeactivation");


		this.subscribeStates("Consumptions.LastVolume");
		this.subscribeStates("Consumptions.TotalVolume");
		this.subscribeStates("Consumptions.CurrentVolume");

		this.subscribeStates("Profiles.Active");
		this.subscribeStates("Profiles.SelectedProfile");

		// Die 8Profil Events adoptieren
		for (let i = 1; i < 9; i++){
			this.subscribeStates("Profiles." + String(i) +".Name");
			this.subscribeStates("Profiles." + String(i) +".Aktiv");
			this.subscribeStates("Profiles." + String(i) +".LeakVolume");
			this.subscribeStates("Profiles." + String(i) +".LeakTime");
			this.subscribeStates("Profiles." + String(i) +".LeakMaxFlow");
			this.subscribeStates("Profiles." + String(i) +".LeakMicroLeakDetection");
			this.subscribeStates("Profiles." + String(i) +".ReturnTimeToStandardProfile");
			this.subscribeStates("Profiles." + String(i) +".Buzzer");
			this.subscribeStates("Profiles." + String(i) +".LeakageWarning");
		}

		// Settings in Objekte schreiben
		await this.setStateAsync("Settings.Language", { val: this.config.device_language, ack: true });
		await this.setStateAsync("Settings.Units", { val: this.config.device_units, ack: true });
		await this.setStateAsync("Settings.MaxFlowLeakageTime", { val: this.config.device_maxflowleakagetime, ack: true });
		await this.setStateAsync("Settings.MicroLeakageTest", { val: this.config.device_microleakagetest, ack: true });
		await this.setStateAsync("Settings.MicroLeakageTestPeriod", { val: this.config.device_microleakagetestperiod, ack: true });
		await this.setStateAsync("Settings.BuzzerOnAlarm", { val: this.config.device_buzzeronalarm, ack: true });

		await this.setStateAsync("Device.IP", { val: this.config.device_network_ip, ack: true });
		await this.setStateAsync("Device.Port", { val: this.config.device_network_port, ack: true });
		await this.setStateAsync("Adapter.PollingInterval", { val: this.config.device_poll_interval, ack: true });

		// You can also add a subscription for multiple states. The following line watches all states starting with "lights."
		// this.subscribeStates("lights.*");
		// Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
		// this.subscribeStates("*");

		/*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		await this.setStateAsync("testVariable", true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		await this.setStateAsync("testVariable", { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		let result = await this.checkPasswordAsync("admin", "iobroker");
		this.log.info("check user admin pw iobroker: " + result);

		result = await this.checkGroupAsync("admin", "admin");
		this.log.info("check group user admin group admin: " + result);

		myAdapter = this;

		// User Einstellungen auslesen
		initSettings();

		// Warten bis auslesen der Settings abgeschlossen ist
		await sleep(15000);

		// Profil Einstellungen auslesen
		initProfiles();

		// Warten bis initialisierung abgeschlossen ist
		await sleep(100000);

		// Timer für das Polling starten
		Intervall_ID = setInterval(pollData, parseInt(this.config.device_poll_interval) * 1000);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);
			clearInterval(Intervall_ID);

			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  * @param {string} id
	//  * @param {ioBroker.Object | null | undefined} obj
	//  */
	// onObjectChange(id, obj) {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }
}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Wasserwaechter(options);
} else {
	// otherwise start the instance directly
	new Wasserwaechter();
}

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function prepareGetRequest(command){
	// URL aus den Settings-Daten zusammenbauen
	return "http://" + myAdapter.config.device_network_ip + ":" + myAdapter.config.device_network_port + "/safe-tec/get/" + command;
}

async function initSettings(){

	myAdapter.log.info("reading out Settings ...");
	const delayTimeMS = 800;

	// Spracheinstellung auslesen
	getLanguage();
	await sleep(delayTimeMS);
	getUnits();
	await sleep(delayTimeMS);
	getMaxFlowLeakageTime();
	await sleep(delayTimeMS);
	getMicroLeakageTest();
	await sleep(delayTimeMS);
	getMicroLeakageTestPeriod();
	await sleep(delayTimeMS);
	getBuzzerOnAlarm();
	await sleep(delayTimeMS);
	// Temperatursensor
	getTemperatureSensorInstalled();
	if(universalReturnValue === true){
		myAdapter.log.info("Init: Temperatursensor ist installiert");
		await sleep(delayTimeMS);
		// Drucksensor Limit auslesen
	}else{
		myAdapter.log.info("Init: Temperatursensor ist nicht installiert");
	}
	await sleep(delayTimeMS);

	// Drucksensor
	getPressureSensorInstalled();
	if(universalReturnValue === true){
		myAdapter.log.info("Init: Drucksensor ist installiert");
		await sleep(delayTimeMS);
		// Drucksensor Limit auslesen
	}else{
		myAdapter.log.info("Init: Drucksensor ist nicht installiert");
	}
	await sleep(delayTimeMS);

	// Leitfähigkeitssensor
	getConductionSensorInstalled();
	if(universalReturnValue === true){
		myAdapter.log.info("Init: Leitfähigkeitssensor ist installiert");
	}else{
		myAdapter.log.info("Init: Leitfähigkeitssensor ist nicht installiert");
	}
	await sleep(delayTimeMS);

	getConductivityLimit();
	await sleep(delayTimeMS);
	getConductivityFactor();
	await sleep(delayTimeMS);
	getFirmwareVersion();
	await sleep(delayTimeMS);
	getSerialNumber();
	await sleep(delayTimeMS);
	getCodeNumber();
	await sleep(delayTimeMS);
	getMacAddress();
	await sleep(delayTimeMS);
	getNextMaintenance();
}

async function initProfiles(){

	myAdapter.log.info("init Profile trigger erhalten");
	const sleepTime = 800;
	// anzahl aktive Profile ermitteln
	getNumActiveProfiles();
	await sleep(sleepTime);
	getSelectedProfile();
	await sleep(sleepTime);

	if(universalReturnValue != null){

		myAdapter.log.info("Wir haben " + String(universalReturnValue) +" Aktive Profile.");
		myAdapter.setStateAsync("Profiles.Active", { val: universalReturnValue, ack: true });

		// alle 8 möglichen Profile durchlaufen
		for(let i = 1; i < 9; i++)
		{
			// Profil Status
			getProfilesStatus(i);
			await sleep(sleepTime);

			if(String(universalReturnValue) == "1")
			{
				myAdapter.log.info("Profil " + String(i) + " ist aktiv");
				myAdapter.setStateAsync("Profiles." + String(i) +".Aktiv", { val: "active", ack: true });
			}else{
				myAdapter.log.info("Profil " + String(i) + " ist inaktiv");
				myAdapter.setStateAsync("Profiles." + String(i) +".Aktiv", { val: "not active", ack: true });
			}

			// Profil Name
			getProfilesName(i);
			await sleep(sleepTime);
			myAdapter.log.info("Profil " + String(i) + " Name: " + String(universalReturnValue));
			myAdapter.setStateAsync("Profiles." + String(i) +".Name", { val: String(universalReturnValue), ack: true });

			// Leckage Volumen
			getProfilesLeakVolume(i);
			await sleep(sleepTime);
			if(String(universalReturnValue) == "0")
			{
				myAdapter.log.info("Profil " + String(i) + " Leak Volume: disabled");
				myAdapter.setStateAsync("Profiles." + String(i) +".LeakVolume", { val: "disabled", ack: true });
			}else{
				myAdapter.log.info("Profil " + String(i) + " Leak Volume: " + String(universalReturnValue) + " L");
				myAdapter.setStateAsync("Profiles." + String(i) +".LeakVolume", { val: String(universalReturnValue), ack: true });
			}

			// Leckage Zeit
			getProfilesLeakTime(i);
			await sleep(sleepTime);
			if(String(universalReturnValue) == "0")
			{
				myAdapter.log.info("Profil " + String(i) + " Leak Time: disabled");
				myAdapter.setStateAsync("Profiles." + String(i) +".LeakTime", { val: "disabled", ack: true });
			}else{
				myAdapter.log.info("Profil " + String(i) + " Leak Time: " + String(universalReturnValue) + " min");
				myAdapter.setStateAsync("Profiles." + String(i) +".LeakTime", { val: String(universalReturnValue), ack: true });
			}

			// Leckage Max Flow L/h
			getProfilesLeakMaxFlow(i);
			await sleep(sleepTime);
			if(String(universalReturnValue) == "0")
			{
				myAdapter.log.info("Profil " + String(i) + " Leak Max Flow: disabled");
				myAdapter.setStateAsync("Profiles." + String(i) +".LeakMaxFlow", { val: "disabled", ack: true });
			}else{
				myAdapter.log.info("Profil " + String(i) + " Max Flow: " + String(universalReturnValue) + " L/h");
				myAdapter.setStateAsync("Profiles." + String(i) +".LeakMaxFlow", { val: String(universalReturnValue), ack: true });
			}

			// Leak Microleak Detection Status
			getProfilesLeakMicroLeakDetection(i);
			await sleep(sleepTime);

			if(String(universalReturnValue) == "1")
			{
				myAdapter.log.info("Profil " + String(i) + " Micro LeakD Detection ist aktiv");
				myAdapter.setStateAsync("Profiles." + String(i) +".LeakMicroLeakDetection", { val: "active", ack: true });
			}else{
				myAdapter.log.info("Profil " + String(i) + " Leak MicroLeak Detection ist inaktiv");
				myAdapter.setStateAsync("Profiles." + String(i) +".LeakMicroLeakDetection", { val: "not active", ack: true });
			}

			// Return Time to Standard Profile
			getProfilesReturnTimeToStandard(i);
			await sleep(sleepTime);
			if(String(universalReturnValue) == "0")
			{
				myAdapter.log.info("Profil " + String(i) + " Return Time to Standard Profile: disabled");
				myAdapter.setStateAsync("Profiles." + String(i) +".ReturnTimeToStandardProfile", { val: "disabled", ack: true });
			}else{
				myAdapter.log.info("Profil " + String(i) + " Return Time to Standard Profile: " + String(universalReturnValue) + " h");
				myAdapter.setStateAsync("Profiles." + String(i) +".ReturnTimeToStandardProfile", { val: String(universalReturnValue), ack: true });
			}

			// Profile Buzzer
			getProfileBuzzer(i);
			await sleep(sleepTime);
			if(String(universalReturnValue) == "0")
			{
				myAdapter.log.info("Profil " + String(i) + " Buzzer: off");
				myAdapter.setStateAsync("Profiles." + String(i) +".Buzzer", { val: "off", ack: true });
			}else{
				myAdapter.log.info("Profil " + String(i) + " Buzzer: on");
				myAdapter.setStateAsync("Profiles." + String(i) +".Buzzer", { val: "on", ack: true });
			}

			// Profile Leakage Warning
			getProfileLeakageWarning(i);
			await sleep(sleepTime);
			if(String(universalReturnValue) == "0")
			{
				myAdapter.log.info("Profil " + String(i) + " Leakage Warning: off");
				myAdapter.setStateAsync("Profiles." + String(i) +".LeakageWarning", { val: "off", ack: true });
			}else{
				myAdapter.log.info("Profil " + String(i) + " Leakage Warning: on");
				myAdapter.setStateAsync("Profiles." + String(i) +".LeakageWarning", { val: "on", ack: true });
			}

		}

	}else{
		myAdapter.log.info("Keine Aktiven Profile!!!");
		myAdapter.setStateAsync("Profiles.Active", { val: 0, ack: true });
	}
}

async function pollData(){

	myAdapter.log.info("poll trigger erhalten");
	const delayTimeMS = 800;

	// Zustandsdaten abrufen
	getTotalWaterVolume();
	await sleep(delayTimeMS);
	getLastWaterVolume();
	await sleep(delayTimeMS);
	currentWaterVolume();
	await sleep(delayTimeMS);
	getAlarm();
	await sleep(delayTimeMS);
	getStopValve();
	await sleep(delayTimeMS);
	getBatterieVoltage();
	await sleep(delayTimeMS);
	getPowerAdaptorDcVoltage();
	await sleep(delayTimeMS);
	getLeakageProtectionTemporaryDeactivation();

	await sleep(delayTimeMS);
	// Wassertemperatur
	if(myAdapter.getState("Device.Sensors.TemperatureSensorInstalled") == "Yes"){
		myAdapter.log.info("Poll: Temperatursensor ist installiert");
		// Wasserdruck auslesen
		if(myAdapter.getState("Settings.Units") === "°C/bar/Liter"){
			// metrisch
			getWaterTemperature("°C");
		}
		else if(myAdapter.getState("Settings.Units") === "°F/psi/US.liq.gal"){
			// imperial
			getWaterTemperature("°F");
		}else
		{
			// undefiniert
			getWaterTemperature("unit unkowen");

		}
		await sleep(delayTimeMS);
	}
	else{
		myAdapter.log.info("Poll: Temperatursensor ist nicht installiert");
	}

	await sleep(delayTimeMS);
	// Wasserdruck
	if(myAdapter.getState("Device.Sensors.PressureSensorInstalled") == "Yes"){
		myAdapter.log.info("Poll: Drucksensor ist installiert");
		// Wasserdruck auslesen
		if(myAdapter.getState("Settings.Units") === "°C/bar/Liter"){
			// metrisch
			getWaterPressure("bar");
		}
		else if(myAdapter.getState("Settings.Units") === "°F/psi/US.liq.gal"){
			// imperial
			getWaterPressure("psi");
		}else
		{
			// undefiniert
			getWaterPressure("unit unkowen");

		}
		await sleep(delayTimeMS);
	}
	else{
		myAdapter.log.info("Poll: Drucksensor ist nicht installiert");
	}

	await sleep(delayTimeMS);
	// Wasser Leitfähigkeit
	if(myAdapter.getState("Device.Sensors.ConductivitySensorInstalled") == "Yes"){
		myAdapter.log.info("Poll: Leitfähigkeitssensor ist installiert");
		// Leitfähigkeit auslesen
		getWaterConductivity("uS/cm");
		await sleep(delayTimeMS);
	}
	else{
		myAdapter.log.info("Poll: Leitfähigkeitssensor ist nicht installiert");
	}

}

function getProfilesStatus(ProfileNumber){
	// Ermitteln ob Profil aktiv ist
	axios.get(prepareGetRequest("PA" + String(ProfileNumber)))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			switch(ProfileNumber)
			{
				case 1:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " = " + String(response.data.getPA1));
					universalReturnValue = response.data.getPA1;
					break;
				case 2:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " = " + String(response.data.getPA2));
					universalReturnValue = response.data.getPA2;
					break;
				case 3:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " = " + String(response.data.getPA3));
					universalReturnValue = response.data.getPA3;
					break;
				case 4:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " = " + String(response.data.getPA4));
					universalReturnValue = response.data.getPA4;
					break;
				case 5:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " = " + String(response.data.getPA5));
					universalReturnValue = response.data.getPA5;
					break;
				case 6:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " = " + String(response.data.getPA6));
					universalReturnValue = response.data.getPA6;
					break;
				case 7:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " = " + String(response.data.getPA7));
					universalReturnValue = response.data.getPA7;
					break;
				case 8:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " = " + String(response.data.getPA8));
					universalReturnValue = response.data.getPA8;
					break;
				default:
					universalReturnValue = null;
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
			universalReturnValue = null;
		});
}

function getProfilesName(ProfileNumber){
	// Profil Name ermitteln PNx
	axios.get(prepareGetRequest("PN" + String(ProfileNumber)))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			switch(ProfileNumber)
			{
				case 1:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Name = " + String(response.data.getPN1));
					universalReturnValue = response.data.getPN1;
					break;
				case 2:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Name = " + String(response.data.getPN2));
					universalReturnValue = response.data.getPN2;
					break;
				case 3:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Name = " + String(response.data.getPN3));
					universalReturnValue = response.data.getPN3;
					break;
				case 4:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Name = " + String(response.data.getPN4));
					universalReturnValue = response.data.getPN4;
					break;
				case 5:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Name = " + String(response.data.getPN5));
					universalReturnValue = response.data.getPN5;
					break;
				case 6:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Name = " + String(response.data.getPN6));
					universalReturnValue = response.data.getPN6;
					break;
				case 7:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Name = " + String(response.data.getPN7));
					universalReturnValue = response.data.getPN7;
					break;
				case 8:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Name = " + String(response.data.getPN8));
					universalReturnValue = response.data.getPN8;
					break;
				default:
					universalReturnValue = null;
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
			universalReturnValue = null;
		});
}

function getProfilesLeakVolume(ProfileNumber){
	// Profil Volumen Leckage ermitteln PVx
	axios.get(prepareGetRequest("PV" + String(ProfileNumber)))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			switch(ProfileNumber)
			{
				case 1:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Volume = " + String(response.data.getPV1));
					universalReturnValue = response.data.getPV1;
					break;
				case 2:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Volume = " + String(response.data.getPV2));
					universalReturnValue = response.data.getPV2;
					break;
				case 3:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Volume = " + String(response.data.getPV3));
					universalReturnValue = response.data.getPV3;
					break;
				case 4:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Volume = " + String(response.data.getPV4));
					universalReturnValue = response.data.getPV4;
					break;
				case 5:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Volume = " + String(response.data.getPV5));
					universalReturnValue = response.data.getPV5;
					break;
				case 6:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Volume = " + String(response.data.getPV6));
					universalReturnValue = response.data.getPV6;
					break;
				case 7:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Volume = " + String(response.data.getPV7));
					universalReturnValue = response.data.getPV7;
					break;
				case 8:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Volume = " + String(response.data.getPV8));
					universalReturnValue = response.data.getPV8;
					break;
				default:
					universalReturnValue = null;
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
			universalReturnValue = null;
		});
}

function getProfilesLeakTime(ProfileNumber){
	// Profil Zeit Leckage ermitteln PTx
	axios.get(prepareGetRequest("PT" + String(ProfileNumber)))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			switch(ProfileNumber)
			{
				case 1:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Time = " + String(response.data.getPT1));
					universalReturnValue = response.data.getPT1;
					break;
				case 2:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Time = " + String(response.data.getPT2));
					universalReturnValue = response.data.getPT2;
					break;
				case 3:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Time = " + String(response.data.getPT3));
					universalReturnValue = response.data.getPT3;
					break;
				case 4:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Time = " + String(response.data.getPT4));
					universalReturnValue = response.data.getPT4;
					break;
				case 5:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Time = " + String(response.data.getPT5));
					universalReturnValue = response.data.getPT5;
					break;
				case 6:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Time = " + String(response.data.getPT6));
					universalReturnValue = response.data.getPT6;
					break;
				case 7:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Time = " + String(response.data.getPT7));
					universalReturnValue = response.data.getPT7;
					break;
				case 8:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Time = " + String(response.data.getPT8));
					universalReturnValue = response.data.getPT8;
					break;
				default:
					universalReturnValue = null;
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
			universalReturnValue = null;
		});
}

function getProfilesLeakMaxFlow(ProfileNumber){
	// Profil Max Flow l/h Leckage ermitteln PFx
	axios.get(prepareGetRequest("PF" + String(ProfileNumber)))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			switch(ProfileNumber)
			{
				case 1:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Max Flow = " + String(response.data.getPF1));
					universalReturnValue = response.data.getPF1;
					break;
				case 2:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Max Flow = " + String(response.data.getPF2));
					universalReturnValue = response.data.getPF2;
					break;
				case 3:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Max Flow = " + String(response.data.getPF3));
					universalReturnValue = response.data.getPF3;
					break;
				case 4:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Max Flow = " + String(response.data.getPF4));
					universalReturnValue = response.data.getPF4;
					break;
				case 5:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Max Flow = " + String(response.data.getPF5));
					universalReturnValue = response.data.getPF5;
					break;
				case 6:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Max Flow = " + String(response.data.getPF6));
					universalReturnValue = response.data.getPF6;
					break;
				case 7:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Max Flow = " + String(response.data.getPF7));
					universalReturnValue = response.data.getPF7;
					break;
				case 8:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leak Max Flow = " + String(response.data.getPF8));
					universalReturnValue = response.data.getPF8;
					break;
				default:
					universalReturnValue = null;
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
			universalReturnValue = null;
		});
}

function getProfilesLeakMicroLeakDetection(ProfileNumber){
	// Profil Micro Leak Detection PMx
	axios.get(prepareGetRequest("PM" + String(ProfileNumber)))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			switch(ProfileNumber)
			{
				case 1:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Micro Leac Detection = " + String(response.data.getPM1));
					universalReturnValue = response.data.getPM1;
					break;
				case 2:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Micro Leac Detection = " + String(response.data.getPM2));
					universalReturnValue = response.data.getPM2;
					break;
				case 3:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Micro Leac Detection = " + String(response.data.getPM3));
					universalReturnValue = response.data.getPM3;
					break;
				case 4:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Micro Leac Detection = " + String(response.data.getPM4));
					universalReturnValue = response.data.getPM4;
					break;
				case 5:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Micro Leac Detection = " + String(response.data.getPM5));
					universalReturnValue = response.data.getPM5;
					break;
				case 6:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Micro Leac Detection = " + String(response.data.getPM6));
					universalReturnValue = response.data.getPM6;
					break;
				case 7:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Micro Leac Detection = " + String(response.data.getPM7));
					universalReturnValue = response.data.getPM7;
					break;
				case 8:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Micro Leac Detection = " + String(response.data.getPM8));
					universalReturnValue = response.data.getPM8;
					break;
				default:
					universalReturnValue = null;
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
			universalReturnValue = null;
		});
}

function getProfilesReturnTimeToStandard(ProfileNumber){
	// Profil Return Time to Standard Profile PRx
	axios.get(prepareGetRequest("PR" + String(ProfileNumber)))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			switch(ProfileNumber)
			{
				case 1:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Return Time to Standard Profile = " + String(response.data.getPR1));
					universalReturnValue = response.data.getPR1;
					break;
				case 2:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Return Time to Standard Profile = " + String(response.data.getPR2));
					universalReturnValue = response.data.getPR2;
					break;
				case 3:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Return Time to Standard Profile = " + String(response.data.getPR3));
					universalReturnValue = response.data.getPR3;
					break;
				case 4:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Return Time to Standard Profile = " + String(response.data.getPR4));
					universalReturnValue = response.data.getPR4;
					break;
				case 5:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Return Time to Standard Profile = " + String(response.data.getPR5));
					universalReturnValue = response.data.getPR5;
					break;
				case 6:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Return Time to Standard Profile = " + String(response.data.getPR6));
					universalReturnValue = response.data.getPR6;
					break;
				case 7:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Return Time to Standard Profile = " + String(response.data.getPR7));
					universalReturnValue = response.data.getPR7;
					break;
				case 8:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Return Time to Standard Profile = " + String(response.data.getPR8));
					universalReturnValue = response.data.getPR8;
					break;
				default:
					universalReturnValue = null;
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
			universalReturnValue = null;
		});
}

function getProfileBuzzer(ProfileNumber){
	// Profil Buzzer PBx
	axios.get(prepareGetRequest("PB" + String(ProfileNumber)))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			switch(ProfileNumber)
			{
				case 1:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Buzzer = " + String(response.data.getPB1));
					universalReturnValue = response.data.getPB1;
					break;
				case 2:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Buzzer = " + String(response.data.getPB2));
					universalReturnValue = response.data.getPB2;
					break;
				case 3:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Buzzer = " + String(response.data.getPB3));
					universalReturnValue = response.data.getPB3;
					break;
				case 4:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Buzzer = " + String(response.data.getPB4));
					universalReturnValue = response.data.getPB4;
					break;
				case 5:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Buzzer = " + String(response.data.getPB5));
					universalReturnValue = response.data.getPB5;
					break;
				case 6:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Buzzer = " + String(response.data.getPB6));
					universalReturnValue = response.data.getPB6;
					break;
				case 7:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Buzzer = " + String(response.data.getPB7));
					universalReturnValue = response.data.getPB7;
					break;
				case 8:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Buzzer = " + String(response.data.getPB8));
					universalReturnValue = response.data.getPB8;
					break;
				default:
					universalReturnValue = null;
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
			universalReturnValue = null;
		});

}

function getProfileLeakageWarning(ProfileNumber){
	// Profil Leakage Warning PWx
	axios.get(prepareGetRequest("PW" + String(ProfileNumber)))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			switch(ProfileNumber)
			{
				case 1:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leakage Warning = " + String(response.data.getPW1));
					universalReturnValue = response.data.getPW1;
					break;
				case 2:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leakage Warning = " + String(response.data.getPW2));
					universalReturnValue = response.data.getPW2;
					break;
				case 3:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leakage Warning = " + String(response.data.getPW3));
					universalReturnValue = response.data.getPW3;
					break;
				case 4:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leakage Warning = " + String(response.data.getPW4));
					universalReturnValue = response.data.getPW4;
					break;
				case 5:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leakage Warning = " + String(response.data.getPW5));
					universalReturnValue = response.data.getPW5;
					break;
				case 6:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leakage Warning = " + String(response.data.getPW6));
					universalReturnValue = response.data.getPW6;
					break;
				case 7:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leakage Warning = " + String(response.data.getPW7));
					universalReturnValue = response.data.getPW7;
					break;
				case 8:
					myAdapter.log.info("Profile " + String(ProfileNumber) + " Leakage Warning = " + String(response.data.getPW8));
					universalReturnValue = response.data.getPW8;
					break;
				default:
					universalReturnValue = null;
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
			universalReturnValue = null;
		});

}

function getNumActiveProfiles(){
	// Anzahl Profile PRN
	axios.get(prepareGetRequest("PRN"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			myAdapter.log.info("Aktive Profile = " + response.data.getPRN + " Stück");
			universalReturnValue = response.data.getPRN;
		})
		.catch(function(error){
			myAdapter.log.error(error);
			universalReturnValue = null;
		});
}

function getSelectedProfile(){
	// Aktives Profil PRF
	axios.get(prepareGetRequest("PRF"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			myAdapter.log.info("Selected Profile = " + response.data.getPRF);
			myAdapter.setStateAsync("Profiles.SelectedProfile", { val: String(response.data.getPRF), ack: true });
			universalReturnValue = response.data.getPRF;
		})
		.catch(function(error){
			myAdapter.log.error(error);
			universalReturnValue = null;
		});
}

function getStopValve(){
	// Spannung Stützbatterie AB
	axios.get(prepareGetRequest("AB"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			if(response.data.getAB === "1"){
				myAdapter.log.info("Absperrung = offen");
				myAdapter.setStateAsync("Conditions.StopValve", { val: "open", ack: true });
			}else if(response.data.getAB === "2"){
				myAdapter.setStateAsync("Conditions.StopValve", { val: "closed", ack: true });
				myAdapter.log.info("Absperrung = geschlossen");
			}else{
				myAdapter.setStateAsync("Conditions.StopValve", { val: "undefined", ack: true });
				myAdapter.log.info("Absperrung = undefiniert");
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getBatterieVoltage(){
	// Spannung Stützbatterie BAT
	axios.get(prepareGetRequest("BAT"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			const btv = parseFloat(String(response.data.getBAT).replace(",",".")).toFixed(2);
			myAdapter.log.info("Batteriespannung = " + response.data.getBAT + " Volt");
			myAdapter.log.info("Batteriespannung = " + String(btv) + " Volt (Zahl)");
			myAdapter.setStateAsync("Conditions.BatteryVoltage", { val: btv, ack: true });

		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getPowerAdaptorDcVoltage(){
	// Spannung Netzteil NET
	axios.get(prepareGetRequest("NET"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			const pav = parseFloat(String(response.data.getNET).replace(",",".")).toFixed(2);
			myAdapter.log.info("Power Adaptor DC Voltage = " + response.data.getNET + " Volt");
			myAdapter.log.info("Netzteil Spannung = " + String(pav) + " Volt (Zahl)");
			myAdapter.setStateAsync("Conditions.PowerAdaptorDcVoltage", { val: pav, ack: true });

		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function currentWaterVolume(){
	// Aktuelle Wasserentnahme AVO
	axios.get(prepareGetRequest("AVO"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			myAdapter.log.info("Aktuelle Wasserentnahme = " + response.data.getAVO + " Liter");
			myAdapter.setStateAsync("Consumptions.CurrentVolume", { val: String(parseFloat(String(response.data.getAVO).replace("mL","")) / 1000), ack: true });
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getLastWaterVolume(){
	// Letztes gezapftes Volumen LTV
	axios.get(prepareGetRequest("LTV"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			myAdapter.log.info("Letztes gezapftes Volumen = " + response.data.getLTV + " Liter");
			myAdapter.setStateAsync("Consumptions.LastVolume", { val: response.data.getLTV, ack: true });
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getTotalWaterVolume(){
	// Gesamtes Volumen VOL
	axios.get(prepareGetRequest("VOL"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			myAdapter.log.info("Gesamtwasserverbrauch = " + response.data.getVOL + " Liter");
			myAdapter.setStateAsync("Consumptions.TotalVolume", { val: String(parseFloat(String(response.data.getVOL).replace("Vol[L]","")) / 1000), ack: true });
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getWaterTemperature(unit){
	// Wassertemperatur CEL
	axios.get(prepareGetRequest("CEL"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			myAdapter.log.info("WasserTemperatur = " + response.data.getCEL + " " + unit);
			myAdapter.setStateAsync("Consumptions.WaterTemperature", { val: String(response.data.getCEL), ack: true });
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getWaterPressure(unit){
	// Wasserdruck BAR
	axios.get(prepareGetRequest("BAR"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			myAdapter.log.info("Wasser Druck = " + response.data.getBAR + " " + unit);
			myAdapter.setStateAsync("Consumptions.WaterPressure", { val: String(response.data.getBAR), ack: true });
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getWaterConductivity(unit){
	// Wasser Leitfähigkeit CND
	axios.get(prepareGetRequest("CND"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			myAdapter.log.info("Wasser Leitfähigkeit = " + response.data.getCND + " " + unit);
			myAdapter.setStateAsync("Consumptions.WaterConductivity", { val: String(response.data.getCND), ack: true });
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}


function getAlarm(){
	// Alarm ALA
	axios.get(prepareGetRequest("ALA"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			myAdapter.log.info("Alarm Code = " + response.data.getALA);
			switch(String(response.data.getALA)){
				case "FF":
					myAdapter.setStateAsync("Conditions.Alarm", { val: "NO ALARM", ack: true });
					myAdapter.log.info("Alarm: NO ALARM");
					break;
				case"A1":
					myAdapter.setStateAsync("Conditions.Alarm", { val: "ALARM END SWITCH", ack: true });
					myAdapter.log.info("Alarm: ALARM END SWITCH");
					break;
				case"A2":
					myAdapter.setStateAsync("Conditions.Alarm", { val: "NO NETWORK", ack: true });
					myAdapter.log.info("Alarm: NO NETWORK");
					break;
				case"A3":
					myAdapter.setStateAsync("Conditions.Alarm", { val: "ALARM VOLUME LEAKAGE", ack: true });
					myAdapter.log.info("Alarm: ALARM VOLUME LEAKAGE");
					break;
				case"A4":
					myAdapter.setStateAsync("Conditions.Alarm", { val: "ALARM TIME LEAKAGE", ack: true });
					myAdapter.log.info("Alarm: ALARM TIME LEAKAGE");
					break;
				case"A5":
					myAdapter.setStateAsync("Conditions.Alarm", { val: "ALARM MAX FLOW LEAKAGE", ack: true });
					myAdapter.log.info("Alarm: ALARM MAX FLOW LEAKAGE");
					break;
				case"A6":
					myAdapter.setStateAsync("Conditions.Alarm", { val: "ALARM MICRO LEAKAGE", ack: true });
					myAdapter.log.info("Alarm: ALARM MICRO LEAKAGE");
					break;
				case"A7":
					myAdapter.setStateAsync("Conditions.Alarm", { val: "ALARM EXT. SENSOR LEAKAGE", ack: true });
					myAdapter.log.info("Alarm: ALARM EXT. SENSOR LEAKAGE");
					break;
				case"A8":
					myAdapter.setStateAsync("Conditions.Alarm", { val: "ALARM TURBINE BLOCKED", ack: true });
					myAdapter.log.info("Alarm: ALARM TURBINE BLOCKED");
					break;
				case"A9":
					myAdapter.setStateAsync("Conditions.Alarm", { val: "ALARM PRESSURE SENSOR ERROR", ack: true });
					myAdapter.log.info("Alarm: ALARM PRESSURE SENSOR ERROR");
					break;
				case"AA":
					myAdapter.setStateAsync("Conditions.Alarm", { val: "ALARM TEMPERATURE SENSOR ERROR", ack: true });
					myAdapter.log.info("Alarm: ALARM TEMPERATURE SENSOR ERROR");
					break;
				case"AB":
					myAdapter.setStateAsync("Conditions.Alarm", { val: "ALARM CONDUCTIVITY SENSOR ERROR", ack: true });
					myAdapter.log.info("Alarm: ALARM CONDUCTIVITY SENSOR ERROR");
					break;
				case"AC":
					myAdapter.setStateAsync("Conditions.Alarm", { val: "ALARM TO HIGH CONDUCTIVITY", ack: true });
					myAdapter.log.info("Alarm: ALARM TO HIGH CONDUCTIVITY");
					break;
				case"AD":
					myAdapter.setStateAsync("Conditions.Alarm", { val: "LOW BATTERY", ack: true });
					myAdapter.log.info("Alarm: LOW BATTERY");
					break;
				case"AE":
					myAdapter.setStateAsync("Conditions.Alarm", { val: "WARNING VOLUME LEAKAGE", ack: true });
					myAdapter.log.info("WARNING VOLUME LEAKAGE");
					break;
				case"AF":
					myAdapter.setStateAsync("Conditions.Alarm", { val: "ALARM NO POWER SUPPLY", ack: true });
					myAdapter.log.info("ALARM NO POWER SUPPLY");
					break;
				default:
					myAdapter.setStateAsync("Conditions.Alarm", { val: "undefined", ack: true });
					myAdapter.log.info("Alarm: undefiniert");
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getLeakageProtectionTemporaryDeactivation(){
	// Leakage Protection Temporary Deactivation TMP
	axios.get(prepareGetRequest("TMP"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			if(response.data.getTMP === "0"){
				myAdapter.log.info("Leakage Protection Temporary Deactivation = disabled");
				myAdapter.setStateAsync("Conditions.LeakageProtectionTemporaryDeactivation", { val: "disabled", ack: true });
			}else{
				myAdapter.log.info("Leakage Protection Temporary Deactivation = " + String(response.data.getTMP) + " s");
				myAdapter.setStateAsync("Conditions.LeakageProtectionTemporaryDeactivation", { val: response.data.getTMP, ack: true });
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getLanguage(){
	// Sracheinstellungen auslesen LNG
	axios.get(prepareGetRequest("LNG"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			if(response.data.getLNG != null){
				myAdapter.log.info("Language = " + String(response.data.getLNG));
				switch(String(response.data.getLNG).substring(0,1))
				{
					case "0":
						// German
						myAdapter.setStateAsync("Settings.Language", { val: "German", ack: true });
						break;
					case "1":
						// English
						myAdapter.setStateAsync("Settings.Language", { val: "English", ack: true });
						break;
					case "2":
						// Spanish
						myAdapter.setStateAsync("Settings.Language", { val: "Spanish", ack: true });
						break;
					case "3":
						// Italian
						myAdapter.setStateAsync("Settings.Language", { val: "Italian", ack: true });
						break;
					case "4":
						// Polish
						myAdapter.setStateAsync("Settings.Language", { val: "Polish", ack: true });
						break;
					default:
						// undefiniert
						myAdapter.setStateAsync("Settings.Language", { val: "undefined", ack: true });
				}
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getUnits(){
	// Einheiten Einstellung auslesen UNI
	axios.get(prepareGetRequest("UNI"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			if(response.data.getUNI != null){
				myAdapter.log.info("Units = " + String(response.data.getUNI));
				switch(String(response.data.getUNI).substring(0,1))
				{
					case "0":
						// Dezimal: °C/bar/Liter
						myAdapter.setStateAsync("Settings.Units", { val: "°C/bar/Liter", ack: true });
						break;
					case "1":
						// Imperial: °F/psi/US.liq.gal
						myAdapter.setStateAsync("Settings.Units", { val: "°F/psi/US.liq.gal", ack: true });
						break;
					default:
						// undefiniert
						myAdapter.setStateAsync("Settings.Units", { val: "undefined", ack: true });
				}
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getMaxFlowLeakageTime(){
	// Einheiten Einstellung auslesen T2
	axios.get(prepareGetRequest("T2"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			if(response.data.getT2 != null){
				myAdapter.log.info("Max Flow Leakage Time = " + String(response.data.getT2) + " min");
				myAdapter.setStateAsync("Settings.MaxFlowLeakageTime", { val: String(response.data.getT2), ack: true });
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getMicroLeakageTest(){
	// Micro Leakage Test DMA
	axios.get(prepareGetRequest("DMA"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			if(response.data.getDMA != null){
				myAdapter.log.info("Micro Leakage Test = " + String(response.data.getDMA));
				switch(String(response.data.getDMA).substring(0,1))
				{
					case "0":
						// disabled
						myAdapter.setStateAsync("Settings.MicroLeakageTest", { val: "disabled", ack: true });
						break;
					case "1":
						// warning
						myAdapter.setStateAsync("Settings.MicroLeakageTest", { val: "warning", ack: true });
						break;
					case "2":
						// shutoff
						myAdapter.setStateAsync("Settings.MicroLeakageTest", { val: "shutoff", ack: true });
						break;
					default:
						// undefiniert
						myAdapter.setStateAsync("Settings.MicroLeakageTest", { val: "undefined", ack: true });
				}
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getMicroLeakageTestPeriod(){
	// Micro Leakage Test Period DRP
	axios.get(prepareGetRequest("DRP"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			if(response.data.getDRP != null){
				myAdapter.log.info("Micro Leakage Test Period = " + String(response.data.getDRP));
				switch(String(response.data.getDRP).substring(0,1))
				{
					case "0":
						// always
						myAdapter.setStateAsync("Settings.MicroLeakageTestPeriod", { val: "always", ack: true });
						break;
					case "1":
						// day
						myAdapter.setStateAsync("Settings.MicroLeakageTestPeriod", { val: "day", ack: true });
						break;
					case "2":
						// week
						myAdapter.setStateAsync("Settings.MicroLeakageTestPeriod", { val: "week", ack: true });
						break;
					case "3":
						// month
						myAdapter.setStateAsync("Settings.MicroLeakageTestPeriod", { val: "month", ack: true });
						break;
					default:
						// undefiniert
						myAdapter.setStateAsync("Settings.MicroLeakageTestPeriod", { val: "undefined", ack: true });
				}
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getBuzzerOnAlarm(){
	// Buzzer On Alarm BUZ
	axios.get(prepareGetRequest("BUZ"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			if(response.data.getBUZ != null){
				myAdapter.log.info("Buzzer On Alarm = " + String(response.data.getBUZ));
				switch(String(response.data.getBUZ).substring(0,1))
				{
					case "0":
						// always
						myAdapter.setStateAsync("Settings.BuzzerOnAlarm", { val: "disabled", ack: true });
						break;
					case "1":
						// day
						myAdapter.setStateAsync("Settings.BuzzerOnAlarm", { val: "enabled", ack: true });
						break;
					default:
						// undefiniert
						myAdapter.setStateAsync("Settings.BuzzerOnAlarm", { val: "undefined", ack: true });
				}
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getTemperatureSensorInstalled(){
	// Temperature Sensor installed TSD
	axios.get(prepareGetRequest("TSD"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			if(response.data.getTSD === "1"){
				myAdapter.log.info("Temperature Sensor = not installed");
				myAdapter.setStateAsync("Device.Sensors.TemperatureSensorInstalled", { val: "No", ack: true });
				universalReturnValue = false;
			}else{
				myAdapter.log.info("Temperature Sensor = installed");
				myAdapter.setStateAsync("Device.Sensors.TemperatureSensorInstalled", { val: "Yes", ack: true });
				universalReturnValue = true;
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getPressureSensorInstalled(){
	// Pressure Sensor installed PSD
	axios.get(prepareGetRequest("PSD"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			if(response.data.getPSD === "1"){
				myAdapter.log.info("Pressure Sensor = not installed");
				myAdapter.setStateAsync("Device.Sensors.PressureSensorInstalled", { val: "No", ack: true });
				universalReturnValue = false;
			}else{
				myAdapter.log.info("Pressure Sensor = installed");
				myAdapter.setStateAsync("Device.Sensors.PressureSensorInstalled", { val: "Yes", ack: true });
				universalReturnValue = true;
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getConductionSensorInstalled(){
	// Conductivity Sensor Installed CSD
	axios.get(prepareGetRequest("CSD"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			if(response.data.getCSD === "1"){
				myAdapter.log.info("Conductivity Sensor = not installed");
				myAdapter.setStateAsync("Device.Sensors.ConductivitySensorInstalled", { val: "No", ack: true });
				universalReturnValue = false;
			}else{
				myAdapter.log.info("Conductivity Sensor = installed");
				myAdapter.setStateAsync("Device.Sensors.ConductivitySensorInstalled", { val: "Yes", ack: true });
				universalReturnValue = true;
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getConductivityLimit(){
	// Conductivity Limit CNL
	axios.get(prepareGetRequest("CNL"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			if(response.data.getCNL === "0"){
				myAdapter.log.info("Conductivity Limit = disabled");
				myAdapter.setStateAsync("Settings.ConductivityLimit", { val: "disabled", ack: true });
			}else{
				myAdapter.log.info("Leakage Protection Temporary Deactivation = " + String(response.data.getCNL) + " uS/cm");
				myAdapter.setStateAsync("Settings.ConductivityLimit", { val: response.data.getCNL, ack: true });
			}
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getConductivityFactor(){
	// Conductivity Factor CNF
	axios.get(prepareGetRequest("CNF"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			myAdapter.log.info("Conductivity Factor =" + String(response.data.getCNF));
			myAdapter.setStateAsync("Settings.ConductivityFactor", { val: String(response.data.getCNF), ack: true });
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getFirmwareVersion(){
	// Firmware Version VER
	axios.get(prepareGetRequest("VER"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			myAdapter.log.info("Device FirmwareVersion =" + String(response.data.getVER));
			myAdapter.setStateAsync("Device.FirmwareVersion", { val: String(response.data.getVER), ack: true });
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getSerialNumber(){
	// Serial Number SRN
	axios.get(prepareGetRequest("SRN"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			myAdapter.log.info("Device Serial Number = " + String(response.data.getSRN));
			myAdapter.setStateAsync("Device.SerialNumber", { val: String(response.data.getSRN), ack: true });
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getCodeNumber(){
	// Code Number CNO
	axios.get(prepareGetRequest("CNO"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			myAdapter.log.info("Device Code Number = " + String(response.data.getCNO));
			myAdapter.setStateAsync("Device.CodeNumber", { val: String(response.data.getCNO), ack: true });
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getMacAddress(){
	// MAC Adresse MAC
	axios.get(prepareGetRequest("MAC"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			myAdapter.log.info("MAC Adresse = " + String(response.data.getMAC));
			myAdapter.setStateAsync("Device.MacAddress", { val: String(response.data.getMAC), ack: true });
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}

function getNextMaintenance(){
	// Next Maintenance SRV
	axios.get(prepareGetRequest("SRV"))
		.then(function(response){
			myAdapter.log.info(JSON.stringify(response.data));
			myAdapter.log.info("Next Maintenance = " + String(response.data.getSRV));
			myAdapter.setStateAsync("Device.NextMaintenance", { val: String(response.data.getSRV), ack: true });
		})
		.catch(function(error){
			myAdapter.log.error(error);
		});
}
