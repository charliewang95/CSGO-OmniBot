Discord = require("discord.js");

exports.findLeastAvailableNumber = (indices) => {
	let num = 1;
	while (num < 1000) {
		if (!indices.includes(num)) {
			return num;
		}
		num++;
	}
	return 0;
}

exports.getExistingCarsString = (cars) => {
	if (cars.length === 0) {
		return "无。";
	}

	let output = "";
	for (let car of cars) {
		let line = `\n[车队${car.id}] - ${car.time} - (${car.members.length}/${car.maxMember})：${getMembersString(car)}`;
		output += line;
	}
	return output;
}

exports.getMembersString = (car) => {
	if (car.members && car.members.length > 0) {
		return car.members.map(member => member.name).join(", ");
	}
	return "";
}

exports.createEmbed = (message, color = '#0099ff', footer) => {
  let exampleEmbed = new Discord.MessageEmbed()
    .setColor(color)
	.setDescription(message);
  if (footer) {
	exampleEmbed = exampleEmbed.setFooter(footer);
  }
  return exampleEmbed;
}

exports.getCSGOStats = async (player) => {
	output = ``;
	output += `\n${player?.nickname}`;
	output += `\n-----------------------`;
	output += `\n等级：${player?.games?.csgo?.skillLevel}`;
	output += `\n等级分：${player?.games?.csgo?.faceitElo}`;

	let stats = await player?.games?.csgo?.getStats();
	output += `\nK/D：${stats?.averageKDRatio}`;
	output += `\n爆头率：${stats?.averageHeadshots}%`;
	output += `\n胜率：${stats?.winRate}%`;
	output += `\n近况：${stats?.recentResults.map(result => result == 1 ? '胜' : '负').join("")}`;
	output += `\n-----------------------`;
	return output;
}