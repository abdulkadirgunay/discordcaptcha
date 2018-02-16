module.exports = async (message, config, Discord, fs, latestVersion) => {
	var blockCommand, removeBlockCommand, banCommand, clearCommand, verifylogs, versionCommand, createRole;
	config["commands"]["blockUser"].enabled ? blockCommand = require("../commands/block.js") : blockCommand = false;
	config["commands"]["removeBlockFromUser"].enabled ? removeBlockCommand = require("../commands/removeBlock.js") : removeBlockCommand = false;
	config["commands"]["banGuildMember"].enabled ? banCommand = require("../commands/removeBlock.js") : banCommand = false;
	config["commands"]["clear"].enabled ? clearCommand = require("../commands/clear.js") : clearCommand = false;
	config["commands"]["version"].enabled ? versionCommand = true : versionCommand = false;
	config["commands"]["makerole"].enabled ? createRole = require("../commands/makerole.js") : createRole = false;
	config.logging ? verifylogs = require("../src/logs.json") : verifylogs = false;
	const Handler = require("../api/Handler.js");

	// Bot Commands
	if (message.content.startsWith(config.prefix)) {
		switch (message.content.split(" ")[0]) {
		case config.prefix + config["commands"]["banGuildMember"].command:
			if (!banCommand) return;
			banCommand(message, config["commands"]["banGuildMember"].contributors)
			break;
		case config.prefix + config["commands"]["blockUser"].command:
			if (!blockCommand) return;
			blockCommand(message, config["commands"]["blockUser"].contributors);
			break;
		case config.prefix + config["commands"]["removeBlockFromUser"].command:
			if (!removeBlockCommand) return;
			removeBlockCommand(message, config["commands"]["removeBlockFromUser"].contributors);
			break;
		case config.prefix + config["commands"]["clear"].command:
			if (!clearCommand) return;
			clearCommand(message, config["commands"]["clear"].contributors);
			break;
		case config.prefix + "eval":
			if (message.author.id === config.ownerid && config.evalAllowed === "true") {
				message.channel.send(":outbox_tray: Output: ```JavaScript\n" + eval(message.content.substr(6)) + "\n```");
			}
			break;
		case config.prefix + config["commands"]["version"].command:
			versionCommand ? message.channel.send(new Discord.RichEmbed()
				.setColor("RANDOM")
				.setTitle("Version")
				.setDescription(`Current DiscordCaptcha version: \`${config.version}\`\nLatest version: \`${latestVersion}\``)
				.addField("Repository", "https://github.com/y21/discordcaptcha/")
				.setTimestamp()
			) : null;
			break;
		case config.prefix + config["commands"]["makerole"].command:
			if (!createRole) return;
			createRole(message);
			break;
		case config.prefix + config["commands"]["unverify"].command:
			if (config["commands"]["unverify"].enabled && message.member.roles.has(config.userrole)) {
				require("../commands/unverify.js")(message, config);
			}
			break;
		}
	}


	// API Commands
	if (message.content.startsWith(config.prefix)) {
		if (message.content.split(" ")[0] == config.prefix + "api") {
			switch (message.content.split(" ")[1]) {
			case config["commands"]["queries"].command:
				if (message.author.id === config.ownerid && config["commands"]["queries"].enabled) {
					message.channel.send("```js\n// Query\n\n" + require("util").inspect(await new Handler("GetQueryEntries").request()) + "\n```");
				}
				break;
			case config["commands"]["querydelete"].command:
				if (config["commands"]["querydelete"].contributors.includes(message.author.tag) && config["commands"]["querydelete"].enabled) {
					new Handler("DeleteQueryEntries").request();
					message.channel.send("Deleted the query.");
				}
				break;
			case config["commands"]["purgelogs"].command:
				if (config["commands"]["purgelogs"].contributors.includes(message.author.tag) && config["commands"]["purgelogs"].enabled) {
					new Handler("PurgeVerifyLogs").request();
					message.channel.send("Purged logs.");
				}
				break;
			case config["commands"]["logs"].command:
				if (config["commands"]["logs"].contributors.includes(message.author.tag) && config["commands"]["logs"].enabled) {
					message.channel.send("```js\n// Logs\n\n" + require("util").inspect(await new Handler("GetLogs").request()) + "\n```");
				}
				break;
			}
		}
	}
};
