class Captcha {
	/**
     * @param {string} captcha - The captcha (pass null and call generate method if it shall be random)
     * @param {object} author - The author object (Has to has an id property and should look like <@123456789>)
     */
	constructor(captcha, author) {
		this._captcha = captcha;
		this.author = author;
	}

	/**
     * @returns {string} Captcha value of class
     */
	generate() {
		this._captcha = (Math.random().toString().substr(2)).repeat(2);
		return this._captcha;
	}

	get captcha(){
		return this._captcha;
	}
}
// Module Imports and instances
const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
const snekfetch = require("snekfetch");
var sql = require("sqlite");
sql.open('./src/db.sqlite');

// Command Imports
const config = require("./src/config.json");
const callback_ = err => {
	err ? console.error(err) : null;
};


let queue = [], latestVersion;

client.on("ready", () => {
	try {
		console.log("Logged in as " + client.user.tag + "!");
		client.user.setActivity(config.streamingGame, {url: config.streamingLink, type: "STREAMING"});
		client.guilds.size > 1 ? console.log("It looks like this bot is on more than one guild. It is recommended not to have this bot on more than one since it could do random stuff.") : null;
		client.guilds.forEach(guild => {
			!guild.roles.get(config.userrole) ? console.log(`${guild.name} has no userrole or the snowflake that was given in the config file is invalid.`) : null;
		});
	} catch (e) {
		console.log("[DISCORDCAPTCHA-readyEvent] >> " + e);
	}
});

client.on("message", async (message) => {
	try{
        let blocked = await sql.get('select * from blocked where id="' + message.author.id + '"');
		if(blocked) message.member.kick();
		if (message.channel.name === "verify") {
			message.delete();
			if (message.content === `${config.prefix}verify`) {
				if(await sql.get('select * from queries where id="' + message.author.id + '"') || message.member.roles.has(config.userrole)) return message.reply("Already verified or in queue!");
				let captchaInstance = new Captcha(null, message.author);
				let captcha = captchaInstance.generate();
				message.author.send(new Discord.RichEmbed()
					.setTitle("Verification")
					.setDescription("Please send the following text into the verify channel in guild `" + message.guild.name + "`\n\n**Verification bot made by y21#0909**")
				).catch(e => e.toString().includes("Cannot send messages to this user") ? message.reply("please turn on direct messages") : null);
				message.author.send("```https\n" + config.prefix + "verify " + captchaInstance.captcha + "\n```");
                sql.run('insert into queries values ("' + message.author.id + '")');
				message.channel.awaitMessages(msg => msg.content === config.prefix + "verify " + captchaInstance.captcha && msg.author === message.author, {
					max: 1,
					errors: ["time"]
				})
					.then(() => {
						message.author.send({
							embed: {
								color: 0x00ff00,
								description: "Successfully verified on `" + message.guild.name + "`"
							}
						});
						config.logging ? client.channels.find("name", config.chat).send("<@" + message.author.id + "> was successfully verified.") : null;
						sql.run('insert into logs values ("' + message.author.id + '", "' + Date.now() + '")');
						sql.run('delete from queries where id="' + message.author.id + '"');
						queue.pop();
						message.member.addRole(config.userrole).catch(error => console.log(error));
						delete captchaInstance;
					}).catch(() => {});
			}
		}

		require("./src/Commands.js")(message, config, Discord, fs, latestVersion); // Command Handler
	}catch(e){
		console.log(e);
	}
});
process.on("unhandledRejection", (err) => {
	console.log(err);
});

client.login(config.token);
