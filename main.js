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

let Intervall_ID;

//Reference to my own adapter
let myAdapter;

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

		await this.setObjectNotExistsAsync("deviceIP", {
			type: "state",
			common: {
				name: "deviceIP",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("devicePort", {
			type: "state",
			common: {
				name: "devicePort",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("devicePollInterval", {
			type: "state",
			common: {
				name: "devicePollInterval",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

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

		// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
		this.subscribeStates("testVariable");
		this.subscribeStates("deviceIP");
		this.subscribeStates("devicePort");
		this.subscribeStates("devicePollInterval");

		await this.setStateAsync("deviceIP", { val: this.config.device_network_ip, ack: true });
		await this.setStateAsync("devicePort", { val: this.config.device_network_port, ack: true });
		await this.setStateAsync("devicePollInterval", { val: this.config.device_poll_interval, ack: true });

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

		// Timer für das Polling starten
		Intervall_ID = setInterval(pollData, parseInt(this.config.device_poll_interval) * 1000);

		myAdapter = this;
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

const getDeviceBatteryVoltage = new Promise((resolve,reject) => {
	let result = null;
	if (result != null) {
		resolve(result);
	}else{
		reject("Error HTTP Request -> BAT");
	}
});


function pollData(){
	myAdapter.log.info("trigger erhalten");

	if(false){
		const delayTime = 1000;
		let counter = 0;
		// Spannung Stützbatterie BAT
		setTimeout(GetDeviceState,counter * delayTime, "BAT");
		counter++;
		// Gesamtwassermenge VOL
		setTimeout(GetDeviceState,counter * delayTime,"VOL");
		counter++;
		// Altuelle Wasserentnahme AVO
		setTimeout(GetDeviceState,counter * delayTime,"AVO");
		counter++;
		// Letztes gezapftes Volumen LTV
		setTimeout(GetDeviceState,counter * delayTime,"LTV");
		counter++;
	}else{
		getDeviceBatteryVoltage.then((ergebnis) => {
			myAdapter.log.info(ergebnis);
		}).catch((ergebnis) => {
			myAdapter.log.info(ergebnis);
		});
	}
}



function GetDeviceState(CMD){
	let answer;
	// Spannung Stützbatterie
	try {
		require("request")(prepareGetRequest(CMD), function (error, response, result) {
		//request(prepareGetRequest(CMD), function (error, response, result) {
			if (result != null) {
				myAdapter.log.info(result);
				answer = result;
			// setState("a_andreas.0.sys_variablen.Objekt_JSON", result, true);
			}
			else{
				myAdapter.log.error("Error HTTP Request -> State: " + CMD);
			}
		}).on("error", function (e) {myAdapter.log.error("try " + e);});}
	catch (e) {
		myAdapter.log.error("catch " + e);
	}
	return answer;
}

function prepareGetRequest(command){
	const requeststring = "http://" + myAdapter.config.device_network_ip + ":" + myAdapter.config.device_network_port + "/safe-tec/get/" + command;
	myAdapter.log.info("Request String: " + requeststring);
	return requeststring;
}

