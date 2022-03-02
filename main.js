"use strict";

/*
 * Created with @iobroker/create-adapter v2.1.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const { rejects } = require("assert");
const { request } = require("http");
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

		// Device States
		await this.setObjectNotExistsAsync("Settings.IP", {
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

		await this.setObjectNotExistsAsync("Settings.Port", {
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

		await this.setObjectNotExistsAsync("Settings.PollingInterval", {
			type: "state",
			common: {
				name: "Device Polling Interval",
				type: "string",
				role: "indicator",
				unit: "s",
				read: true,
				write: true,
			},
			native: {},
		});

		// Condition States

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

		// Consumptions States

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

		}


		// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
		this.subscribeStates("testVariable");
		this.subscribeStates("Settings.IP");
		this.subscribeStates("Settings.Port");
		this.subscribeStates("Settings.PollingInterval");
		this.subscribeStates("Conditions.BatteryVoltage");
		this.subscribeStates("Conditions.StopValve");
		this.subscribeStates("Conditions.Alarm");
		this.subscribeStates("Consumptions.LastVolume");
		this.subscribeStates("Consumptions.TotalVolume");
		this.subscribeStates("Consumptions.CurrentVolume");
		this.subscribeStates("Profiles.Active");

		// Die 8Profil Events adoptieren
		for (let i = 1; i < 9; i++){
			this.subscribeStates("Profiles." + String(i) +".Name");
			this.subscribeStates("Profiles." + String(i) +".Aktiv");
			this.subscribeStates("Profiles." + String(i) +".LeakVolume");
			this.subscribeStates("Profiles." + String(i) +".LeakTime");
		}

		// Settings in Objekte schreiben
		await this.setStateAsync("Settings.IP", { val: this.config.device_network_ip, ack: true });
		await this.setStateAsync("Settings.Port", { val: this.config.device_network_port, ack: true });
		await this.setStateAsync("Settings.PollingInterval", { val: this.config.device_poll_interval, ack: true });

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

		// Profile erforschen
		initProfiles();

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

async function initProfiles(){

	myAdapter.log.info("init Profile trigger erhalten");

	// anzahl aktive Profile ermitteln
	getNumActiveProfiles();
	await sleep(1000);

	if(universalReturnValue != null){

		myAdapter.log.info("Wir haben " + String(universalReturnValue) +" Aktive Profile.");
		myAdapter.setStateAsync("Profiles.Active", { val: universalReturnValue, ack: true });

		// alle 8 möglichen Profile durchlaufen
		for(let i = 1; i < 9; i++)
		{
			// Profil Status
			getProfilesStatus(i);
			await sleep(1000);

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
			await sleep(1000);
			myAdapter.log.info("Profil " + String(i) + " Name: " + String(universalReturnValue));
			myAdapter.setStateAsync("Profiles." + String(i) +".Name", { val: String(universalReturnValue), ack: true });

			// Leckage Volumen
			getProfilesLeakVolume(i);
			await sleep(1000);
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
			await sleep(1000);
			if(String(universalReturnValue) == "0")
			{
				myAdapter.log.info("Profil " + String(i) + " Leak Time: disabled");
				myAdapter.setStateAsync("Profiles." + String(i) +".LeakTime", { val: "disabled", ack: true });
			}else{
				myAdapter.log.info("Profil " + String(i) + " Leak Time: " + String(universalReturnValue) + " min");
				myAdapter.setStateAsync("Profiles." + String(i) +".LeakTime", { val: String(universalReturnValue), ack: true });
			}
		}

	}else{
		myAdapter.log.info("Keine Aktiven Profile!!!");
		myAdapter.setStateAsync("Profiles.Active", { val: 0, ack: true });
	}
}

async function pollData(){

	myAdapter.log.info("poll trigger erhalten");
	const delayTimeMS = 1000;

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

	/**
	setTimeout(getTotalWaterVolume, 0 * delayTimeMS);
	setTimeout(getLastWaterVolume, 1 * delayTimeMS);
	setTimeout(currentWaterVolume, 2 * delayTimeMS);
	setTimeout(getBatterieVoltage, 3 * delayTimeMS);
	setTimeout(getAlarm, 4 * delayTimeMS);
	setTimeout(getStopValve, 5 * delayTimeMS);
	setTimeout(getNumProfiles, 6 * delayTimeMS);
	setTimeout(getProfileDetails, 10 * delayTimeMS);
	 */
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

